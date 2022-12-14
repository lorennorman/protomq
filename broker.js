import Aedes from 'aedes'

// MQTT Setup
import net from 'net'

const
  broker = Aedes(),
  server = net.createServer(broker.handle),
  mqttPort = 1884

server.listen(mqttPort, function () {
  console.log('MQTT listening on port ', mqttPort)
})

// MQTT-over-Websockets Setup
import http from 'http'
import ws from 'websocket-stream'

const
  httpServer = http.createServer(),
  wsPort = 8888

ws.createServer({ server: httpServer }, broker.handle)

httpServer.listen(wsPort, function () {
  console.log('MQTT listening over WebSocket on port ', wsPort)
})

// App Code
import { addLoggingListeners, addReactiveEmitters } from "./broker/listeners.js"

addLoggingListeners(broker)
addReactiveEmitters(broker)
