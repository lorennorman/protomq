<template>
  <h3>Message Log </h3>
  <div class="messages">
    <div v-for="message in messages">
      <dl>
        <dt>Topic:</dt> <dd :title="message.topic">{{ renderTopic(message) }}</dd>
        <dt>Payload:</dt> <dd :title='message.message'>{{ renderMessage(message) }}</dd>
      </dl>
    </div>
  </div>
</template>

<script setup>
  import { useMQTTStore } from '../stores/mqtt'
  import { parseMessage } from '../message_parser'

  const
    messages = useMQTTStore().messages,
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
