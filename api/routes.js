import { Router } from 'express'

export default mqttBroker => {
  const router = Router()

  // rough draft of possible API:
  //
  // router.get('/status', (req, res) => {
  //   // fetch the broker's current configuration
  //   // - client id validation mode
  //   // - list of valid client ids
  //   // - username/key pair validation mode
  //   // - list of valid username/key pairs
  //   res.json({ status: {} })
  // })

  // router.post('/reset', (req, res) => {
  //   // reset all settings and place broker in most open mode
  //   // - clear valid client ids and allow all
  //   // - clear valid user/key pairs and open auth
  //   // - clear expected messages and optional autoresponses
  //   res.json({ response: 'OK' })
  // })

  // router.post('/client_ids', (req, res) => {
  //   // pull a client id off the request payload
  //   // add the client id to the broker's list of valid ids
  //   // put the broker into client id validation mode
  //   res.json({ response: 'OK' })
  // })

  // router.delete('/client_ids', (req, res) => {
  //   // clear the broker's list of valid client ids
  //   // put the broker into open client id mode
  //   res.json({ response: 'OK' })
  // })

  // router.post('/user_key_pairs', (req, res) => {
  //   // pull a username/key off the request payload
  //   // add the username/key to the broker's list of valid auth creds
  //   // set the broker into authenticated connection mode
  //   res.json({ response: 'OK' })
  // })

  // router.delete('/user_key_pairs', (req, res) => {
  //   // clear the broker's list of valid auth creds
  //   // set the broker into open connection mode
  //   res.json({ response: 'OK' })
  // })

  // router.post('/expect_message', (req, res) => {
  //   // read expected protobuf message name and configuration
  //   // read expected topic to receive on
  //   // read (optional) response message name/config
  //   // read (optional) response topic to use
  //   // set broker into listen-and-respond mode with these settings
  //   res.json({ response: 'OK' })
  // })

  // router.delete('/expect_message', (req, res) => {
  //   // clear expected messages and put broker into open mode
  //   res.json({ response: 'OK' })
  // })

  return router
}
