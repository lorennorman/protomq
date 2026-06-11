/**
  Specify protobufs to listen for and respond with.
  Supports both V2 (nested signal envelopes) and V1 (flat message keys).
  Uses playback scripts from scripts/ directory for demo sequences.
*/
import { find, keys, camelCase } from 'lodash-es'
import { BrokerToDevice, DeviceToBroker, protobufRootV1, resolveV1Topic } from "../protobufs.js"
import { installScriptRunner, matchesTrigger } from './script_runner.js'


// ============================================================================
// Fallback V2 checkin handler (used when no script matches)
// ============================================================================

const handleV2CheckinFallback = (d2bRequest) => {
  if (!d2bRequest.checkin?.request) return null
  return {
    checkin: {
      response: {
        response: 'R_OK',
        totalGpioPins: 30,
        totalAnalogPins: 4,
        referenceVoltage: 2.5,
        componentAdds: {},
        sleepEnabled: false
      }
    }
  }
}


// ============================================================================
// Fallback V1 request/response map (flat message keys, backward compat)
// ============================================================================

const v1RequestToResponseMap = {
  checkinRequest: {
    checkinResponse: {
      response: 'RESPONSE_OK',
      totalGpioPins: 30,
      totalAnalogPins: 4,
      referenceVoltage: 2.5
    }
  }
}


// ============================================================================
// Fallback V1 checkin (description) handler
// ============================================================================
// V1 registration: the device publishes a CreateDescriptionRequest to
// {user}/wprsnpr/info/status (note: no device-uid in that topic) and listens
// for the CreateDescriptionResponse on {user}/wprsnpr/{uid}/info/status/broker.
// The uid is the device's MQTT client id, which the checkin topic doesn't
// carry — so we pull it off the publishing client and rebuild the topic.
const V1_CheckinResponse = protobufRootV1.lookupType('wippersnapper.description.v1.CreateDescriptionResponse')

const v1CheckinResponsePayload = {
  response: 'RESPONSE_OK',
  totalGpioPins: 30,
  totalAnalogPins: 4,
  referenceVoltage: 2.5,
  totalI2cPorts: 1
}

// After the description response, real Adafruit IO sends a CreateSignalRequest
// carrying the hardware (pin) configuration on signals/broker. With no saved
// components it's an EMPTY pinConfigs — `{pinConfigs:{list:[]}}` encodes to the
// 2 bytes 0x32 0x00 — which is exactly what unblocks the firmware's
// `while(!pinCfgCompleted)` poll (nanopb still fires the oneof callback for the
// zero-length submessage). We send it immediately after the checkin response so
// it arrives while the device is connected and subscribed to signals/broker.
const V1_CreateSignalRequest = protobufRootV1.lookupType('wippersnapper.signal.v1.CreateSignalRequest')
const v1EmptyPinConfigsPayload = { pinConfigs: { list: [] } }


// ============================================================================
// Default echo messages
// ============================================================================

const defaultMessages = {
  digitalioAdd: {
    pinName: 'd0',
    gpioDirection: 'DIGITAL_IO_DIRECTION_INPUT',
    sampleMode: 'DIGITAL_IO_SAMPLE_MODE_TIMER',
    period: 5,
    value: false
  }
}


// ============================================================================
// Exports
// ============================================================================

import { ScriptExecutor } from './script_runner.js'

// Module-level script runner state (accessible from API)
let _scriptState = { scripts: new Map(), activeExecutor: null, activeScriptName: null, broker: null }
let _fallbackCheckinEnabled = true

// Registered auto-responders. First match wins.
// Each entry: { name?, trigger: <dot.path>, match?: <wildcard pattern>, response: <B2D-shaped> }
// trigger uses the same dot-path semantics as script steps (e.g. "checkin.request").
// match is a deep partial pattern over the toObject form of the decoded message:
//   - '*' or missing key → wildcard
//   - nested objects → recurse
//   - arrays → match by index
let _autoresponders = []

export const getScriptState = () => _scriptState

export const getFallbackCheckinEnabled = () => _fallbackCheckinEnabled
export const setFallbackCheckinEnabled = (enabled) => { _fallbackCheckinEnabled = enabled }

export const getAutoresponders = () => _autoresponders.map(a => ({ ...a }))
export const addAutoresponder = (entry) => { _autoresponders.push(entry); return _autoresponders.length }
export const clearAutoresponders = () => { const n = _autoresponders.length; _autoresponders = []; return n }
export const removeAutoresponderByName = (name) => {
  const before = _autoresponders.length
  _autoresponders = _autoresponders.filter(a => a.name !== name)
  return before - _autoresponders.length
}

const matchesPattern = (actual, pattern) => {
  if (pattern === '*' || pattern === undefined) return true
  if (pattern === null) return actual === null
  if (Array.isArray(pattern)) {
    if (!Array.isArray(actual)) return false
    return pattern.every((p, i) => matchesPattern(actual[i], p))
  }
  if (typeof pattern === 'object') {
    if (actual === null || typeof actual !== 'object') return false
    return Object.entries(pattern).every(([k, v]) => matchesPattern(actual[k], v))
  }
  return actual === pattern
}

const findAutoresponderResponse = (d2bRequest) => {
  if (_autoresponders.length === 0) return null
  // toObject is computed once and reused for any match-pattern checks below.
  // Note: a raw decode() leaves unset oneof fields undefined; toObject with
  // defaults:true here means match patterns see proto3 zero-values rather
  // than undefined — keep that in mind when authoring patterns.
  let decoded = null
  for (const entry of _autoresponders) {
    if (!matchesTrigger(d2bRequest, entry.trigger)) continue
    if (entry.match) {
      if (!decoded) decoded = DeviceToBroker.toObject(d2bRequest, { enums: String, defaults: true })
      if (!matchesPattern(decoded, entry.match)) continue
    }
    return entry
  }
  return null
}

export const setActiveScript = (name, { disabledSteps = [], autoReset = true } = {}) => {
  const script = _scriptState.scripts.get(name)
  if (!script) return false
  if (_scriptState.activeExecutor) _scriptState.activeExecutor.reset()
  // Merge script-level enabled:false defaults with UI-provided disabledSteps
  const scriptDisabled = script.steps.filter(s => s.enabled === false).map(s => s.name)
  const mergedDisabled = [...new Set([...scriptDisabled, ...disabledSteps])]
  _scriptState.activeExecutor = new ScriptExecutor(script, _scriptState.broker, { disabledSteps: mergedDisabled, autoReset })
  _scriptState.activeScriptName = name
  return true
}

export const deactivateScript = () => {
  if (_scriptState.activeExecutor) _scriptState.activeExecutor.reset()
  _scriptState.activeExecutor = null
  _scriptState.activeScriptName = null
}

export const
  addDefaultPBResponses = async (broker, { activeScriptName = null } = {}) => {
    // Load and install the script runner
    const { scripts, activeExecutor, activeScriptName: resolvedActiveScriptName } = await installScriptRunner(broker, activeScriptName)
    _scriptState = { scripts, activeExecutor, activeScriptName: resolvedActiveScriptName, broker }

    // V2 topic pattern
    console.log("PBResponse Listener: Register (V2 topics: +/ws-d2b/+)")
    broker.subscribe(
      '+/ws-d2b/+',
      (packet, callback) => {
        const rawHex = Buffer.from(packet.payload).toString('hex')
        let d2bRequest
        try {
          d2bRequest = DeviceToBroker.decode(packet.payload)
        } catch (err) {
          console.log(`[V2] Failed to decode payload (${packet.payload.length} bytes, hex: ${rawHex}):`, err.message)
          callback()
          return
        }
        const decodedJson = JSON.stringify(DeviceToBroker.toObject(d2bRequest, { enums: String, defaults: true }), null, 2)

        // Try active script first (use module state so API changes are reflected)
        if (_scriptState.activeExecutor) {
          const handled = _scriptState.activeExecutor.handleMessage(d2bRequest, packet)
          if (handled) {
            callback()
            return
          }
        }

        // Registered autoresponders take precedence over the V2 fallback.
        const autoresponder = findAutoresponderResponse(d2bRequest)
        if (autoresponder) {
          console.log(`[Autoresponder${autoresponder.name ? ` "${autoresponder.name}"` : ''}] trigger=${autoresponder.trigger}\n  raw: ${rawHex}\n  decoded: ${decodedJson}\n  response: ${JSON.stringify(autoresponder.response)}`)
          const b2dResponse = BrokerToDevice.encode(BrokerToDevice.fromObject(autoresponder.response)).finish()
          broker.publish({
            topic: packet.topic.replace('d2b', 'b2d'),
            payload: b2dResponse
          })
          callback()
          return
        }

        // Fallback: V2 nested checkin matching (when no script handles it)
        if (_fallbackCheckinEnabled) {
        const v2Response = handleV2CheckinFallback(d2bRequest)
        if (v2Response) {
          console.log(`[Fallback V2] Auto-Responding to checkin:\n  raw: ${rawHex}\n  decoded: ${decodedJson}`)
          const b2dResponse = BrokerToDevice.encode(BrokerToDevice.fromObject(v2Response)).finish()
          broker.publish({
            topic: packet.topic.replace('d2b', 'b2d'),
            payload: b2dResponse
          })
          callback()
          return
        }
        }

        // Fallback: V1 flat matching
        const v1ResponsePayload = find(v1RequestToResponseMap, (response, requestKey) =>
          d2bRequest[requestKey]
        )

        if (v1ResponsePayload) {
          console.log(`[Fallback V1] Auto-Responding to:\n  raw: ${rawHex}\n  decoded: ${decodedJson}`)
          const b2dResponse = BrokerToDevice.encode(BrokerToDevice.fromObject(v1ResponsePayload)).finish()
          broker.publish({
            topic: packet.topic.replace('d2b', 'b2d'),
            payload: b2dResponse
          })
        } else {
          console.log(`Not Auto-Responding to:\n  raw: ${rawHex}\n  decoded: ${decodedJson}`)
        }

        callback()
      },
      () => console.log('V2 protobuf autoresponders installed')
    )

    // Feed MQTT ACK packets to the active script executor so waitFor steps
    // like checkin.complete can be bound to PUBACK semantics.
    broker.on('ack', (packet) => {
      if (!_scriptState.activeExecutor) return
      _scriptState.activeExecutor.handleAck(packet)
    })

    // V1 topic pattern (for devices on older firmware). Version is inferred
    // purely from topic shape: anything under +/wprsnpr/# is V1. A single
    // wildcard subscription catches every V1 subtopic (checkin, signals,
    // i2c, servo, etc.) in both directions; resolveV1Topic maps each to its
    // proto type so we can decode for the audit log and detect the checkin.
    console.log("PBResponse Listener: Register (V1 topics: +/wprsnpr/#)")
    broker.subscribe(
      '+/wprsnpr/#',
      (packet, callback) => {
        const { topic } = packet
        const rawHex = Buffer.from(packet.payload).toString('hex')
        const resolved = resolveV1Topic(topic)

        // Bidirectional audit: attempt to decode whatever arrived here.
        let decodedJson = null
        if (resolved?.type) {
          try {
            const msg = resolved.type.decode(packet.payload)
            decodedJson = JSON.stringify(resolved.type.toObject(msg, { enums: String, defaults: true }), null, 2)
          } catch (err) {
            console.log(`[V1] Failed to decode ${resolved.name} on ${topic} (${packet.payload.length} bytes, hex: ${rawHex}): ${err.message}`)
          }
        }
        console.log(`[V1 ${resolved?.direction ?? '?'}] ${topic} → ${resolved?.name ?? 'unknown type'}` +
          (decodedJson ? `\n  decoded: ${decodedJson}` : `\n  raw: ${rawHex}`))

        // Fallback checkin: respond with a CreateDescriptionResponse so the
        // device can finish registration and proceed. Gated by the same flag
        // as the V2 checkin fallback.
        if (_fallbackCheckinEnabled && resolved?.isCheckinRequest) {
          const user = topic.slice(0, topic.indexOf('/wprsnpr/'))
          const uid = packet.clientId
          if (!uid) {
            console.log(`[Fallback V1] checkin on ${topic} but packet has no clientId — cannot route response`)
            callback()
            return
          }
          const responseTopic = `${user}/wprsnpr/${uid}/info/status/broker`
          const payload = V1_CheckinResponse.encode(V1_CheckinResponse.fromObject(v1CheckinResponsePayload)).finish()
          console.log(`[Fallback V1] Auto-Responding to checkin → ${responseTopic}\n  response: ${JSON.stringify(v1CheckinResponsePayload)}`)
          broker.publish({ topic: responseTopic, payload })

          // Follow with the hardware (pin) configuration so the device clears its
          // `while(!pinCfgCompleted)` poll. Empty pinConfigs = "no components",
          // matching what real Adafruit IO sends (0x32 0x00).
          const signalTopic = `${user}/wprsnpr/${uid}/signals/broker`
          const signalPayload = V1_CreateSignalRequest.encode(V1_CreateSignalRequest.fromObject(v1EmptyPinConfigsPayload)).finish()
          console.log(`[Fallback V1] Sending empty pin config → ${signalTopic}\n  payload: ${JSON.stringify(v1EmptyPinConfigsPayload)} (${Buffer.from(signalPayload).toString('hex') || '∅'})`)
          broker.publish({ topic: signalTopic, payload: signalPayload })
        }

        callback()
      },
      () => console.log('V1 protobuf autoresponders installed (topics: +/wprsnpr/#)')
    )
  },

  addEchoService = broker => {
    console.log("PBEcho Listener: Register")
    broker.subscribe(
      '+/ws-d2b/+/echo',
      (packet, callback) => {
        const
          payload = JSON.parse(packet.payload),
          messageName = camelCase(keys(payload)[0])
        console.log("Echo request:", messageName, payload)

        const foundDefaults = find(defaultMessages, (settings, name) => {
          return name == messageName
        })

        if(!foundDefaults) {
          console.log("No message found with name:", messageName)
        } else {
          console.log("found:", foundDefaults)
          const b2dResponse = BrokerToDevice.encode({ [messageName]: foundDefaults }).finish()
          const topic = packet.topic.replace('d2b', 'b2d').replace('/echo', '/')
          console.log("publishing echo!", topic)
          broker.publish({
            topic,
            payload: b2dResponse
          })
        }

        callback()
      },
      () => console.log('Protobuf echo service installed')
    )
  }
