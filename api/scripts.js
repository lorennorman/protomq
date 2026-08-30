import { getScriptState, setActiveScript, deactivateScript, getFallbackCheckinEnabled, setFallbackCheckinEnabled } from '../broker/protobuf_autoresponders.js'
import { BrokerToDevice } from '../protobufs.js'

export default (router, broker) => {
  console.log("Installing Scripts API")

  // List all loaded scripts with active state
  router.get('/scripts', (req, res) => {
    const { scripts, activeScriptName, activeExecutor } = getScriptState()

    const list = []
    for (const [filename, script] of scripts) {
      const isActive = filename === activeScriptName
      list.push({
        filename,
        name: script.name,
        description: script.description,
        protoVersion: script.protoVersion,
        active: isActive,
        completedSteps: isActive ? [...(activeExecutor?.completedSteps || [])] : [],
        steps: script.steps.map(step => ({
          name: step.name,
          description: step.description,
          trigger: step.trigger || null,
          after: step.after || null,
          waitFor: step.waitFor || null,
          delay: step.delay || 0,
          topic: step.topic || null,
          enabled: step.enabled !== false,
          hasSend: !!step.send,
          hasResponse: !!step.response,
          send: step.send || null,
          response: step.response || null
        }))
      })
    }

    res.json({ scripts: list, fallbackCheckinEnabled: getFallbackCheckinEnabled() })
  })

  // Toggle fallback checkin auto-responder
  router.post('/scripts/fallback-checkin', (req, res) => {
    const { enabled } = req.body
    setFallbackCheckinEnabled(!!enabled)
    console.log(`[Scripts API] Fallback checkin auto-responder: ${enabled ? 'enabled' : 'disabled'}`)
    res.json({ status: 'OK', fallbackCheckinEnabled: !!enabled })
  })

  // Deactivate the active script
  router.post('/scripts/deactivate', (req, res) => {
    deactivateScript()
    console.log(`[Scripts API] Deactivated active script`)
    res.json({ status: 'OK', active: null })
  })

  // Activate a script by filename
  router.post('/scripts/:name/activate', (req, res) => {
    const { name } = req.params
    const { disabledSteps, autoReset } = req.body || {}
    const ok = setActiveScript(name, { disabledSteps: disabledSteps || [], autoReset: autoReset !== false })
    if (ok) {
      console.log(`[Scripts API] Activated: ${name}`, disabledSteps?.length ? `(disabled: ${disabledSteps.join(', ')})` : '')
      res.json({ status: 'OK', active: name })
    } else {
      res.status(404).json({ error: `Script not found: ${name}` })
    }
  })

  // Reset the active script's execution state
  router.post('/scripts/:name/reset', (req, res) => {
    const { activeExecutor, activeScriptName } = getScriptState()
    const { name } = req.params
    if (name !== activeScriptName || !activeExecutor) {
      res.status(400).json({ error: `Script "${name}" is not the active script` })
      return
    }
    const { disabledSteps, autoReset } = req.body || {}
    activeExecutor.reset(disabledSteps || [], autoReset !== undefined ? autoReset : undefined)
    console.log(`[Scripts API] Reset: ${name}`)
    res.json({ status: 'OK', reset: name })
  })

  // Send a specific step's message
  router.post('/scripts/:name/steps/:stepName/send', (req, res) => {
    const { name, stepName } = req.params
    const { devicePrefix } = req.body
    const { scripts } = getScriptState()
    const script = scripts.get(name)

    if (!script) {
      res.status(404).json({ error: `Script not found: ${name}` })
      return
    }

    const step = script.steps.find(s => s.name === stepName)
    if (!step) {
      res.status(404).json({ error: `Step not found: ${stepName}` })
      return
    }

    // Determine the payload and topic
    const payload = step.send || step.response
    if (!payload) {
      res.status(400).json({ error: `Step "${stepName}" has no send or response payload` })
      return
    }

    // Find the device's B2D subscription topic (V2: {user}/ws-b2d/{uid})
    let topic = devicePrefix
    if (!topic) {
      for (const client of Object.values(broker.clients || {})) {
        if (client.id && client.id.startsWith('io-wipper-')) {
          const subs = Object.keys(client.subscriptions || {})
          topic = subs.find(s => s.includes('/ws-b2d/'))
          if (topic) break
        }
      }
      if (!topic) topic = 'protomq-ui/ws-b2d/unknown'
    }

    try {
      const encoded = BrokerToDevice.encode(BrokerToDevice.fromObject(payload)).finish()
      broker.publish({ topic, payload: encoded })
      console.log(`[Scripts API] Sent step "${stepName}" on ${topic}`)
      res.json({ status: 'OK', topic, step: stepName })
    } catch (e) {
      console.error(`[Scripts API] Encode error:`, e.message)
      res.status(500).json({ error: e.message })
    }
  })
}
