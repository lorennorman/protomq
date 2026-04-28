import { BrokerToDevice } from '../protobufs.js'
import {
  addAutoresponder,
  clearAutoresponders,
  getAutoresponders,
  removeAutoresponderByName,
} from '../broker/protobuf_autoresponders.js'

export default (router, _broker) => {
  console.log("Installing Autoresponse Command")

  // Register an autoresponder. Body shape mirrors a play-script step
  // (without delay/after/waitFor): { name?, trigger, match?, response }.
  // trigger is a dot-path on the decoded D2B message, e.g. "checkin.request".
  router.post('/autoresponse', (req, res) => {
    const { name, trigger, match, response } = req.body || {}

    if (!trigger || typeof trigger !== 'string') {
      return res.status(400).json({
        status: "ERROR",
        message: "autoresponse requires a 'trigger' dot-path string (e.g. 'checkin.request')"
      })
    }
    if (!response || typeof response !== 'object') {
      return res.status(400).json({
        status: "ERROR",
        message: "autoresponse requires a 'response' object (B2D-shaped payload)"
      })
    }

    try {
      // Validate at registration so malformed payloads fail fast.
      BrokerToDevice.encode(BrokerToDevice.fromObject(response)).finish()
    } catch (e) {
      return res.status(400).json({
        status: "ERROR",
        message: `Response payload is not a valid BrokerToDevice: ${e.message}`
      })
    }

    addAutoresponder({ name: name || null, trigger, match: match || null, response })

    console.log(
      `Autoresponse registered: trigger=${trigger}` +
      (name ? ` name="${name}"` : '') +
      (match ? `\n  match: ${JSON.stringify(match)}` : '') +
      `\n  response: ${JSON.stringify(response)}`
    )

    res.json({ status: "OK", count: getAutoresponders().length })
  })

  // List all registered autoresponders.
  router.get('/autoresponse', (_req, res) => {
    res.json({ status: "OK", autoresponders: getAutoresponders() })
  })

  // Remove a single autoresponder by name.
  router.delete('/autoresponse/:name', (req, res) => {
    const removed = removeAutoresponderByName(req.params.name)
    console.log(`Autoresponse removed: name="${req.params.name}" (${removed} matched)`)
    res.json({ status: "OK", removed })
  })

  // Clear all registered autoresponders. Tests should call this in setup
  // and/or teardown so registrations don't leak across cases.
  router.delete('/autoresponse', (_req, res) => {
    const removed = clearAutoresponders()
    console.log(`Autoresponse cleared (${removed} removed)`)
    res.json({ status: "OK", removed })
  })
}
