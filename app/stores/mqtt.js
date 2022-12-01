import { ref, computed } from "vue"
import { defineStore } from "pinia"

export const useMQTTStore = defineStore('mqtt', () => {
  const
    messages = ref([]),
    clients = ref([]),
    subscriptions = ref([])

  function addMessage(newMessage) {
    this.messages.unshift(newMessage)
  }

  return { messages, addMessage, clients, subscriptions }
})
