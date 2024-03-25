<template>
  <MessageLog v-if="messagesMode"/>
  <MessageForm v-else-if="configureMessageMode"/>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { useUIStore } from '/frontend/stores/ui'
  import MessageLog from './MessageLog.vue'
  import MessageForm from './message_form/MessageForm.vue'

  const { messagesMode, configureMessageMode } = storeToRefs(useUIStore())
</script>

<style>
</style>
