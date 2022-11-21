import Aedes from 'aedes'
import { addLoggingListeners } from "./broker/listeners.js"

// MQTT Setup
import net from 'net'

const
  broker = Aedes(),
  server = net.createServer(broker.handle),
  port = 1884

server.listen(port, function () {
  console.log('server started and listening on port ', port)
})

addLoggingListeners(broker)

