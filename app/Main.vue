<template>
  <MessageLog v-if="messagesMode"/>
  <MessageForm v-else-if="configureMessageMode"/>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { useUIStore } from '/app/stores/ui'
  import MessageLog from './main_panel/MessageLog.vue'
  import MessageForm from './main_panel/MessageForm.vue'

  const { messagesMode, configureMessageMode } = storeToRefs(useUIStore())
</script>

<style>
</style>
