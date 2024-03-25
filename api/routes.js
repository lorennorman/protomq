import { Router } from 'express'

export default mqttBroker => {
  const router = Router()

  // router.post('/endpoint', (req, res) => {
  //   res.json({ response: 'OK' })
  // })

  return router
}
