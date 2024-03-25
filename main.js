/** Runs the ProtoMQ application, which is:
- a collection of input protobufs, compiled to a json specification
- an MQTT broker that speaks the provided protobufs
- a web server that provides:
  - WebSocket access to the MQTT broker
  - an HTTP API to control the behavior of the MQTT broker
  - a graphical web frontend that:
    - shows the broker's status, connections, subscriptions, etc
    - shows all of the protobufs available
    - allows manually creating protobufs and sending them to the broker
*/


// Steps:
// [x] ensure a protobuf bundle file is present, provide import instructions if not
// [x] ensure built js files are present, provide Vite build instructions if not
// [x] start the mqtt broker
// [x] open the mqtt broker to websocket connections
// start the web server
import fs from 'fs'

import { createBroker } from './broker/index.js'
import { createWebApp } from './api/index.js'


async function main() {
  // ensure protobufs are ready
  if(!fs.existsSync('protobufs/bundle.json')) {
    console.error("No protobuf bundle found!\nDid you run `npm run import-protos`?")
    return
  }

  // ensure frontend application is built
  if(!fs.existsSync('dist/index.html')) {
    console.error("No web app files found!\nDid you run `npm run build-web`?")
    return
  }

  const
    mqttBroker = createBroker(),
    webServer = createWebApp(mqttBroker)

  console.log("ProtoMQ Ready!")
}


main()
