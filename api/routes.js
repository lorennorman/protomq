import { Router } from 'express'

import enableDisconnect from './disconnect.js'
import enableDeliveries from './deliveries.js'
import enableEcho from './echo.js'


export default broker => {
  const router = Router()

  // middleware: log, extract client id, lookup client, store on req
  router.use((req, res, next) => {
    const
      { client: clientId } = req.body,
      client = broker.clients?.[clientId]

    console.log(clientId
      ? `[API:${req.url}] for "${clientId}"`
      : `[API:${req.url}]`
    )

    req.protomq = { client, clientId }

    next()
  })

  enableDisconnect(router, broker)
  enableDeliveries(router, broker)
  enableEcho(router, broker)

  // rough draft of possible API:
  //
  // router.get('/status', (req, res) => {
  //   // fetch the broker's current configuration
  //   // - clients, subscriptions
  //   // - delivery mailboxes
  //   // - auto-response scripts
  //   res.json({ status: {} })
  // })

  // router.post('/reset', (req, res) => {
  //   // reset all settings and clear all data
  //   // - reset autoresponders to default
  //   // - clear deliver tracker mailboxes
  //   res.json({ response: 'OK' })
  // })

  // router.post('/autoresponse', (req, res) => {
  //   // read expected protobuf message name and configuration
  //   // read expected topic to receive on
  //   // read (optional) response message name/config
  //   // read (optional) response topic to use
  //   // set broker into listen-and-respond mode with these settings
  //   res.json({ response: 'OK' })
  // })

  // router.delete('/autoresponse', (req, res) => {
  //   // clear expected messages and put broker into open mode
  //   res.json({ response: 'OK' })
  // })

  return router
}
