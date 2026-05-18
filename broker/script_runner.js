/**
 * Script Runner - loads and executes playback scripts for ProtoMQ.
 *
 * Scripts are JSON files in the scripts/ directory that define sequences
 * of protobuf messages to send in response to device activity.
 *
 * Script format:
 * {
 *   "name": "Human-readable name",
 *   "description": "What this script tests",
 *   "protoVersion": "v2",
 *   "steps": [
 *     {
 *       "name": "step-id",
 *       "trigger": "checkin.request",     // execute when this field path exists in incoming message
 *       "response": { ... },              // reply on same topic (d2b->b2d)
 *     },
 *     {
 *       "name": "step-id-2",
 *       "after": "step-id",              // execute after named step completes
 *       "waitFor": "checkin.complete",   // wait for this D2B message pattern before executing
 *       "delay": 2000,                   // wait N ms after the "after" step (or after waitFor match)
 *       "topic": "display",              // component topic to publish on
 *       "send": { ... },                 // BrokerToDevice payload
 *     }
 *   ]
 * }
 */
import path from 'path'
import { readdir, readFile } from 'fs/promises'
import { BrokerToDevice, DeviceToBroker } from "../protobufs.js"


/**
 * Load all scripts from the scripts/ directory.
 * Returns a Map of filename -> parsed script object.
 */
export const loadScripts = async (scriptsDir = 'scripts') => {
  const scripts = new Map()

  let files
  try {
    files = await readdir(scriptsDir)
  } catch (e) {
    console.log(`Scripts directory not found: ${scriptsDir}`)
    return scripts
  }

  for (const file of files) {
    if (!file.endsWith('.json')) continue
    try {
      const contents = (await readFile(`${scriptsDir}/${file}`)).toString()
      const script = JSON.parse(contents)
      scripts.set(file.replace('.json', ''), script)
      console.log(`  Loaded script: ${script.name} (${file})`)
    } catch (e) {
      console.warn(`  Failed to load script ${file}: ${e.message}`)
    }
  }

  return scripts
}


const normalizeScriptKey = (value) => {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const parsed = path.parse(trimmed)
  return parsed.ext.toLowerCase() === '.json' ? parsed.name : parsed.base
}


const resolveRequestedScript = (requestedValue, scripts) => {
  const normalized = normalizeScriptKey(requestedValue)
  if (!normalized) return null

  // Exact key match (filename without .json)
  if (scripts.has(normalized)) return normalized

  // Filename or full path to a filename
  const filenameFromPath = normalizeScriptKey(path.basename(String(requestedValue)))
  if (filenameFromPath && scripts.has(filenameFromPath)) return filenameFromPath

  // Human-readable script name match
  for (const [key, script] of scripts.entries()) {
    if (script?.name === requestedValue) return key
  }

  return null
}


/**
 * Check if a decoded DeviceToBroker message matches a trigger pattern.
 * Trigger is a dot-separated field path, e.g., "checkin.request".
 * Returns true if traversing the path finds a truthy value.
 */
export const matchesTrigger = (decodedMessage, trigger) => {
  const parts = trigger.split('.')
  let current = decodedMessage
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return false
    current = current[part]
  }
  return current != null
}


/**
 * Derive the B2D topic from an incoming D2B topic.
 * V2 devices subscribe to a single B2D topic: {prefix}/ws-b2d/{device-uid}
 * e.g., "test_user/ws-d2b/feather-esp32s3-xyz" -> "test_user/ws-b2d/feather-esp32s3-xyz"
 */
const deriveB2dTopic = (d2bTopic) => d2bTopic.replace('/ws-d2b/', '/ws-b2d/')


/**
 * Create a ScriptExecutor for a specific script.
 * Tracks execution state and handles step sequencing.
 */
export class ScriptExecutor {
  constructor(script, broker, { disabledSteps = [], autoReset = true } = {}) {
    this.script = script
    this.broker = broker
    this.completedSteps = new Set()
    this.pendingTimers = []
    this._pendingWaitSteps = []  // Steps waiting for a D2B message match
    const stepsDisabledByFlag = script.steps
      .filter(s => s.enabled === false)
      .map(s => s.name)
    this._disabledSteps = new Set([...disabledSteps, ...stepsDisabledByFlag])
    this.autoReset = autoReset
    this._b2dTopic = null  // Derived from first incoming D2B topic
    this._pendingCheckinResponseAcks = 0
  }

  get name() {
    return this.script.name
  }

  /**
   * Process an incoming D2B message. Returns true if a trigger matched.
   */
  handleMessage(decodedMessage, packet) {
    this._b2dTopic = deriveB2dTopic(packet.topic)
    let matched = false

    // Check trigger steps
    for (const step of this.script.steps) {
      if (!step.trigger) continue
      if (this._disabledSteps.has(step.name)) continue

      if (matchesTrigger(decodedMessage, step.trigger)) {
        // Auto-reset: if trigger already completed, reset and re-run from scratch
        if (this.completedSteps.has(step.name)) {
          if (!this.autoReset) continue
          console.log(`[Script: ${this.script.name}] Auto-reset: trigger "${step.name}" fired again`)
          this.reset()
          // TODO: deriveB2dTopic only handles V2 topics — will need V1 topic derivation when V1 scripts are supported
          this._b2dTopic = deriveB2dTopic(packet.topic)
        }
        console.log(`[Script: ${this.script.name}] Trigger matched: "${step.name}" (${step.trigger})`)
        this._executeStep(step, packet)
        matched = true
        break
      }
    }

    if (this._checkPendingWaitSteps(decodedMessage, packet)) matched = true

    return matched
  }

  /**
   * Process MQTT ACK events for script-generated publishes.
   * For V2 scripts, checkin.complete is emitted when the broker receives
   * PUBACK for a checkin response publish.
   */
  handleAck(packet) {
    if (this._pendingCheckinResponseAcks <= 0) return false

    console.log(
      `[Script: ${this.script.name}] ACK event cmd=${packet?.cmd ?? 'unknown'} messageId=${packet?.messageId ?? 'n/a'} pendingCheckinAcks=${this._pendingCheckinResponseAcks}`
    )

    if (packet?.cmd !== 'puback') return false

    this._pendingCheckinResponseAcks -= 1
    console.log(`[Script: ${this.script.name}] PUBACK received for checkin response; emitting checkin.complete`)

    // Synthetic event object so waitFor="checkin.complete" works for both
    // transport-level ACK completion and any message-level completion payloads.
    return this._checkPendingWaitSteps({ checkin: { complete: {} }, checkinComplete: {} }, packet)
  }

  /**
   * Log subscribers + QoS for the current B2D topic to explain whether
   * PUBACK can happen for scripted checkin responses.
   */
  _getB2dSubscriptionQosInfo() {
    const rows = []
    let hasAckCapableSubscriber = false
    const clients = Object.values(this.broker?.clients || {})
    for (const client of clients) {
      const sub = client?.subscriptions?.[this._b2dTopic]
      if (!sub) continue
      const qos = sub?.qos ?? -1
      if (typeof qos === 'number' && qos >= 1) hasAckCapableSubscriber = true
      rows.push(`${client.id || 'unknown-client'}:qos${qos}`)
    }

    return { rows, hasAckCapableSubscriber }
  }

  _logB2dSubscriptionQos() {
    const { rows, hasAckCapableSubscriber } = this._getB2dSubscriptionQosInfo()

    if (rows.length === 0) {
      console.log(
        `[Script: ${this.script.name}] checkin-response debug topic=${this._b2dTopic} subscribers=none`
      )
      return { hasAckCapableSubscriber }
    }

    console.log(
      `[Script: ${this.script.name}] checkin-response debug topic=${this._b2dTopic} subscribers=${rows.join(', ')}`
    )
    return { hasAckCapableSubscriber }
  }

  /**
   * Check pending waitFor steps against a decoded/synthetic message object.
   */
  _checkPendingWaitSteps(decodedMessage, packet) {
    let matched = false
    for (let i = this._pendingWaitSteps.length - 1; i >= 0; i--) {
      const step = this._pendingWaitSteps[i]
      if (matchesTrigger(decodedMessage, step.waitFor)) {
        console.log(`[Script: ${this.script.name}] waitFor matched: "${step.name}" (${step.waitFor})`)
        this._pendingWaitSteps.splice(i, 1)
        const delay = step.delay || 0
        if (delay > 0) {
          console.log(`[Script: ${this.script.name}] Executing "${step.name}" after ${delay}ms delay`)
          const timer = setTimeout(() => this._executeStep(step, packet), delay)
          this.pendingTimers.push(timer)
        } else {
          this._executeStep(step, packet)
        }
        matched = true
      }
    }
    return matched
  }

  /**
   * Execute a step: send response, mark complete, schedule follow-ups.
   */
  _executeStep(step, packet) {
    let emitCheckinCompleteWithoutAck = false

    // Send response/payload to the device's B2D topic
    if (step.response) {
      console.log(`[Script: ${this.script.name}] Sending response for "${step.name}" on ${this._b2dTopic}`)
      const encoded = BrokerToDevice.encode(BrokerToDevice.fromObject(step.response)).finish()
      const publishPacket = { topic: this._b2dTopic, payload: encoded }

      // checkin.complete should map to transport completion (PUBACK), not
      // merely enqueueing the checkin response publish.
      if (step.response.checkin?.response || step.response.checkinResponse) {
        // QoS 1 is required so MQTT PUBACK can drive checkin.complete.
        publishPacket.qos = 1
        const { hasAckCapableSubscriber } = this._logB2dSubscriptionQos()

        if (hasAckCapableSubscriber) {
          this._pendingCheckinResponseAcks += 1
        }

        console.log(
          `[Script: ${this.script.name}] checkin-response publish qos=${publishPacket.qos} pendingCheckinAcks=${this._pendingCheckinResponseAcks}`
        )

        // If all subscribers are QoS 0 (or there are no subscribers yet),
        // PUBACK will never arrive. Emit checkin.complete after this step is
        // fully completed and follow-up waitFor steps are queued.
        if (!hasAckCapableSubscriber) {
          emitCheckinCompleteWithoutAck = true
        }
      }

      this.broker.publish(publishPacket)
    }

    if (step.send) {
      console.log(`[Script: ${this.script.name}] Sending payload for "${step.name}" on ${this._b2dTopic}`)
      const encoded = BrokerToDevice.encode(BrokerToDevice.fromObject(step.send)).finish()
      this.broker.publish({ topic: this._b2dTopic, payload: encoded })
    }

    // Mark step complete
    this.completedSteps.add(step.name)

    // Schedule follow-up steps
    this._scheduleFollowUps(step.name)

    if (emitCheckinCompleteWithoutAck) {
      console.log(
        `[Script: ${this.script.name}] No QoS>=1 subscribers for ${this._b2dTopic}; emitting checkin.complete without PUBACK`
      )
      this._checkPendingWaitSteps(
        { checkin: { complete: {} }, checkinComplete: {} },
        packet
      )
    }
  }

  /**
   * Find and schedule steps that should run after the given step.
   */
  _scheduleFollowUps(completedStepName) {
    for (const step of this.script.steps) {
      if (step.after !== completedStepName) continue
      if (this.completedSteps.has(step.name)) continue
      if (this._disabledSteps.has(step.name)) continue

      // If step has a waitFor, queue it for D2B message matching instead of a timer
      if (step.waitFor) {
        console.log(`[Script: ${this.script.name}] Queuing "${step.name}" waitFor: ${step.waitFor}`)
        this._pendingWaitSteps.push(step)
        continue
      }

      const delay = step.delay || 0
      console.log(`[Script: ${this.script.name}] Scheduling "${step.name}" in ${delay}ms`)

      const timer = setTimeout(() => {
        this._executeStep(step)
      }, delay)

      this.pendingTimers.push(timer)
    }
  }

  /**
   * Reset execution state (for re-running the script).
   */
  reset(disabledSteps, autoReset) {
    this.pendingTimers.forEach(t => clearTimeout(t))
    this.pendingTimers = []
    this._pendingWaitSteps = []
    this.completedSteps.clear()
    this._b2dTopic = null
    this._pendingCheckinResponseAcks = 0
    if (disabledSteps !== undefined) this._disabledSteps = new Set(disabledSteps)
    if (autoReset !== undefined) this.autoReset = autoReset
    console.log(`[Script: ${this.script.name}] Reset`)
  }
}


/**
 * Install the script runner on a broker.
 * Loads all scripts from the scripts/ directory and creates executors.
 * Returns the active executor (or null if no scripts loaded).
 */
export const installScriptRunner = async (broker, activeScriptName = null) => {
  console.log("Script Runner: Loading scripts...")
  const scripts = await loadScripts()

  if (scripts.size === 0) {
    console.log("Script Runner: No scripts found")
    return { scripts, activeExecutor: null }
  }

  console.log(`Script Runner: Loaded ${scripts.size} script(s)`)

  // Only activate a script if explicitly requested
  const resolvedScriptName = resolveRequestedScript(activeScriptName, scripts)
  if (resolvedScriptName) {
    const activeScript = scripts.get(resolvedScriptName)
    console.log(`Script Runner: Active script: "${activeScript.name}" (${resolvedScriptName})`)
    const executor = new ScriptExecutor(activeScript, broker)
    return { scripts, activeExecutor: executor, activeScriptName: resolvedScriptName }
  }

  if (activeScriptName) {
    const available = [...scripts.entries()].map(([key, script]) => `${key} ("${script?.name || 'Unnamed'}")`)
    console.warn(`Script Runner: Could not resolve --active-script="${activeScriptName}"`)
    if (available.length > 0) {
      console.warn(`Script Runner: Available scripts: ${available.join(', ')}`)
    }
  }

  console.log(`Script Runner: No script active (activate via UI or --script flag)`)
  return { scripts, activeExecutor: null, activeScriptName: null }
}
