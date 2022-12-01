import { flatten, map, sortBy, uniq } from "lodash-es"
import { useMQTTStore } from './stores/mqtt'

const
  mqttUrl = `ws://localhost:8888`,
  options = {
    clientId: `web-${Math.round(Math.random()*10000000000)}`,
    connectTimeout: 60 * 1000,
    keepalive: 60,
    resubscribe: false,
    reconnectPeriod: 6000,
  }

export const connect = () => {
  const
    mqttStore = useMQTTStore(),
    client = mqtt.connect(mqttUrl, options)

  // Subscribe to all messages
  client.on('connect', () => {
    client.subscribe(["#", "$SYS/#"], err => {
      if(err) { console.error(err) }
    })
  })

  // Handle incoming messages
  client.on('message', (topic, message) => {
    // store every message
    mqttStore.addMessage({ topic, message })

    // magic broker inspection topic
    if(topic === "state/clients") {
      const clientsCollection = JSON.parse(message)

      // clients data store update
      mqttStore.clients = map(clientsCollection, "id")

      // subscriptions data store update
      mqttStore.subscriptions =  sortBy(uniq(flatten(map(clientsCollection, "subscriptions"))))
    }
  })
}
