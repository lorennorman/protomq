import { flatten, map, sortBy, uniq } from "lodash-es"
import { watch } from "vue"
import { storeToRefs } from "pinia"
import { useMQTTStore } from './stores/mqtt'
import { useSubscriptionStore } from './stores/subscriptions'

const
  mqttUrl = `ws://${window.location.hostname}:8888`,
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
    subscriptionStore = useSubscriptionStore(),
    { activeTopics } = storeToRefs(subscriptionStore),
    client = mqtt.connect(mqttUrl, options)

  mqttStore.client = client

  let currentTopics = []

  // Unwrap Vue reactive values to plain string array for MQTT client
  const toPlainTopics = (topics) => Array.from(topics, t => String(t))

  const applyTopics = (topics) => {
    const newTopics = toPlainTopics(topics)
    if (currentTopics.length) {
      client.unsubscribe(currentTopics, err => {
        if (err) console.error('Unsubscribe error:', err)
      })
    }
    currentTopics = newTopics
    client.subscribe(currentTopics, err => {
      if (err) console.error('Subscribe error:', err)
    })
  }

  // Subscribe on connect using the current mode's topics
  client.on('connect', () => {
    // New broker session — clear stale recents from previous session
    subscriptionStore.onBrokerConnect()
    applyTopics(activeTopics.value)
  })

  // Re-subscribe when subscription mode changes
  watch(activeTopics, (newTopics) => {
    if (client.connected) {
      applyTopics(newTopics)
    }
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
      subscriptionStore.setLiveSubscriptions(sortBy(uniq(flatten(map(clientsCollection, "subscriptions")))))
    }
  })
}
