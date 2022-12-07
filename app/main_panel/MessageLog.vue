<template>
  <h3>Message Log </h3>
  <div class="messages">
    <p class="hidden-label">{{ rejectedCount }} hidden</p>
    <div v-for="message in filteredMessages">
      <dl>
        <dt>Topic:</dt> <dd :title="message.topic">{{ renderTopic(message) }}</dd>
        <dt>Payload:</dt> <dd :title='message.message'>{{ renderMessage(message) }}</dd>
      </dl>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useMQTTStore } from '../stores/mqtt'
  import { parseMessage } from '../message_parser'
  import { storeToRefs } from 'pinia'

  const
    mqttStore = useMQTTStore(),
    { filteredMessages, rejectedMessages } = storeToRefs(mqttStore),
    rejectedCount = computed(() => rejectedMessages.value.length),
    renderTopic = ({ topic }) => topic.startsWith("$SYS")
      ? `$SYS/.../${topic.split('/').slice(2).join('/')}`
      : topic,
    renderMessage = (message) => parseMessage(message)
</script>

<style>
  main dt {
    font-weight: bold;
    color: gray;
  }

  main dd {
    font-style: italic;
  }

  main hr {
    width: 80%;
    color: lightgray;
  }
</style>
