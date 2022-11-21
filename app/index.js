// from react
const options = {
  clientId: `web-${Math.round(Math.random()*10000000000)}`,
  connectTimeout: 60 * 1000,
  keepalive: 60,
  resubscribe: false,
  reconnectPeriod: 6000, // wait between connection attempts
}

const config = {
  "mqttPort": "8888",
  "mqttHost": "localhost",
  "mqttProtocol": "ws",
}

const mqttUrl = `${config.mqttProtocol}://${config.mqttHost}:${config.mqttPort}`
const client = mqtt.connect(mqttUrl, options)

console.log(client)
