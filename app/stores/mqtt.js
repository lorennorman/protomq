import { ref } from "vue"
import { defineStore } from "pinia"

export const useMQTTStore = defineStore('mqtt', () => {
  const
    client = ref(null),
    messages = ref([]),
    clients = ref([])

  function addMessage(newMessage) {
    this.messages.unshift(newMessage)
  }

  function publishMessage(topic, message) {
    if(!this.client) { throw new Error("MQTT Client not Connected!") }

    this.client.publish(topic, message)
  }

  return { messages, addMessage, publishMessage, clients }
})
