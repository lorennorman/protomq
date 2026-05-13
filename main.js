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


const parseActiveScriptArg = (argv) => {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--active-script=')) {
      return arg.slice('--active-script='.length)
    }
    if (arg === '--active-script') {
      const nextArg = argv[i + 1]
      return nextArg && !nextArg.startsWith('--') ? nextArg : null
    }
  }

  // Support npm config passthrough form:
  // npm run start --active-script="My Script"
  // npm exposes this as process.env.npm_config_active_script.
  const npmConfigArg = process.env.npm_config_active_script
  if (npmConfigArg && String(npmConfigArg).trim()) {
    return String(npmConfigArg).trim()
  }

  return null
}

async function main() {
  const requestedActiveScript = parseActiveScriptArg(process.argv.slice(2))

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

  const broker = await createBroker({ activeScriptName: requestedActiveScript })

  const webServer = createWebApp(broker)
}

main()
