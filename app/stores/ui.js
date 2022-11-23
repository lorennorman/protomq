import { ref, computed } from "vue"
import { defineStore } from "pinia"

export const useUIStore = defineStore('ui', () => {
  const
    mode = ref('messages'),
    messagesMode = computed(() => mode.value === 'messages'),
    configureMessageMode = computed(() => mode.value === 'configureMessage')

  function setMode(newMode) {
    console.log('setMode', newMode)
    this.mode = newMode
  }

  return { mode, setMode, messagesMode, configureMessageMode }
})
