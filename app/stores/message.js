import { ref } from "vue"
import { defineStore } from "pinia"
import { useUIStore } from './ui'

export const useMessageStore = defineStore('message', () => {
  return {
    messageObject: ref(null),
    messageType: ref(null),
    newMessage: function(messageType) {
      this.messageType = messageType
      this.messageObject = {}
      useUIStore().setMode('configureMessage')
    }
  }
})
