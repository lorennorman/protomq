import { flatten, map, uniq } from "lodash-es"

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

const
  messages = [],
  clients = [],
  subscriptions = []

client.on('message', (topic, message) => {
  messages.unshift({ topic, message })
  refreshMessages()
  if(topic === "state/clients") {
    const clientsCollection = JSON.parse(message)
    clients.splice(0, Infinity, ...map(clientsCollection, "id"))
    subscriptions.splice(0, Infinity, ...uniq(flatten(map(clientsCollection, "subscriptions"))))
    console.log("Clients:", clients)
    console.log("Subscriptions:", subscriptions)
    refreshClients()
    refreshSubscriptions()
  }
})

const refreshMessages = () => {
  document.getElementsByClassName('messages')[0].innerHTML = messages.map(message => `
    <div>
      <dl>
        <dt>Topic:</dt> <dd title="${ message.topic }">${ parseTopic(message.topic) }</dd>
        <dt>Payload:</dt> <dd title='${ message.message }'>${ parseMessage(message.message) }</dd>
      </dl>
    </div>
  `).join("<hr />")
}

const refreshClients = () => {
  document.getElementsByClassName("clients")[0].innerHTML = clients.map(client => `
    <li>${ client }</li>
  `).join('')
}

const refreshSubscriptions = () => {
  document.getElementsByClassName("subscriptions")[0].innerHTML = subscriptions.map(subscription => `
    <li>${ subscription }</li>
  `).join('')
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
