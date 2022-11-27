import { ref } from "vue"
import { defineStore } from "pinia"
import { useUIStore } from './ui'

export const useMessageStore = defineStore('message', () => {
  return {
    message: ref(null),
    newMessage: function(message) {
      this.message = message
      useUIStore().setMode('configureMessage')
    }
  }
})
