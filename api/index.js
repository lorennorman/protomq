import express from 'express'

import makeAPIRoutes from './routes.js'


export const createWebApp = (mqttBroker) => {
  const
    app = express(),
    port = 5173

  // mount the built frontend files
  app.use(express.static('dist'))
  // mount the protobuf import directory
  app.use('/protobufs', express.static('protobufs'))

  // enable json and expose the API endpoints
  app.use(express.json())
  app.use('/api', makeAPIRoutes(mqttBroker))

  // start the server
  app.listen(port, () => {
    console.log(`HTTP frontend & API listening on port`, port)
  })

  return app
}
