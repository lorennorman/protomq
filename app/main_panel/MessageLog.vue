<template>
  <div class="message-log">
    <h3>Message Log </h3>

    <div class="messages">
      <p class="hidden-label">{{ rejectedCount }} hidden</p>

      <TransitionGroup name="message-list">
        <Message v-for="message in filteredMessages" :message="message" :key="message.id"/>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useMQTTStore } from '../stores/mqtt'
  import { storeToRefs } from 'pinia'
  import Message from './Message.vue'

  const
    mqttStore = useMQTTStore(),
    { filteredMessages, rejectedMessages } = storeToRefs(mqttStore),
    rejectedCount = computed(() => rejectedMessages.value.length)
</script>

<style>
  .message-log {
    max-width: 550px;
  }
  .message-list-move,
  .message-list-enter-active,
  .message-list-leave-active {
    transition: all 0.5s ease;
  }

  .message-list-enter-from,
  .message-list-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }
  .message-list-leave-active {
    position: absolute;
}
</style>
