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

client.on('connect', () => {
  client.subscribe(["#", "$SYS/#"], err => {
    if(err) { console.error(err) }
  })
})

const messages = []
client.on('message', (topic, message) => {
  messages.unshift({ topic, message })
  refreshMessages()
})

const refreshMessages = () => {
  document.getElementsByTagName('main')[0].innerHTML = messages.map(message => `
    <div>
      <dl>
        <dt>Topic:</dt> <dd title="${ message.topic }">${ parseTopic(message.topic) }</dd>
        <dt>Payload:</dt> <dd title='${ message.message }'>${ parseMessage(message.message) }</dd>
      </dl>
    </div>
  `).join("<hr />")
}

const parseTopic = topic => {
  if(topic.startsWith("$SYS")) {
    const action = topic.split('/').slice(2)
    return `$SYS/.../${action.join('/')}`
  }

  return topic
}

const parseMessage = message => {
  if(!message) { return message }

  try {
    message = JSON.parse(message)
  } catch(error) {}

  // try protobufs, etc

  return JSON.stringify(message, null, 2)
}
