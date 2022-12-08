import { ref, computed } from "vue"
import { defineStore } from "pinia"
import { useSubscriptionStore } from "./subscriptions"
import { reject, without } from "lodash-es"

export const useMQTTStore = defineStore('mqtt', () => {
  const
    subStore = useSubscriptionStore(),
    client = ref(null),
    clientId = computed(() => client.value?.options.clientId),
    messages = ref([]),
    clients = ref([]),
    filteredMessages = computed(() => {
      const { topicIsFiltered } = subStore
      return reject(messages.value, message => topicIsFiltered(message.topic))
    }),
    rejectedMessages = computed(() => without(messages.value, ...filteredMessages.value))

  function addMessage(newMessage) {
    this.messages.unshift({
      ...newMessage,
      id: `message-${Math.round(Math.random()*10000000000)}`
    })
  }

  function publishMessage(topic, message) {
    if(!this.client) { throw new Error("MQTT Client not Connected!") }

    this.client.publish(topic, message)
  }

  return { messages, filteredMessages, rejectedMessages, addMessage, publishMessage, client, clients, clientId }
})
