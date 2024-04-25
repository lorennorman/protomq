import net from 'net'
import http from 'http'
import ws from 'websocket-stream'
import Aedes from 'aedes'

import { addLoggingListeners, addReactiveEmitters } from "./listeners.js"
import { addDefaultAuthResponses } from './authorization.js'
import { addDefaultPBResponses, addEchoService } from './protobuf_autoresponders.js'


export const createBroker = () => {
  const
    broker = Aedes(),
    server = net.createServer(broker.handle),
    mqttPort = 1884,
    httpServer = http.createServer(),
    wsPort = 8888

  server.listen(mqttPort, function () {
    console.log('MQTT listening on port', mqttPort)
  })

  ws.createServer({ server: httpServer }, broker.handle)

  httpServer.listen(wsPort, function () {
    console.log('MQTT-via-WebSocket listening on port', wsPort)
  })

  // add behavior to the broker
  addLoggingListeners(broker)
  addReactiveEmitters(broker)
  addDefaultAuthResponses(broker)
  addDefaultPBResponses(broker)
  addEchoService(broker)

  return broker
}
