import express from 'express'

import makeAPIRoutes from './routes.js'


export const createWebApp = (mqttBroker) => {
  const
    app = express(),
    port = 5174

  // mount the built frontend files
  app.use(express.static('dist'))
  // mount the protobuf import directory
  app.use('/protobufs', express.static('protobufs'))

  // expose the API endpoints
  app.use('/api', makeAPIRoutes(mqttBroker))

  // start the server
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

  return app
}
