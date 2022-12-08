<template>
  <div class="message-container">
    <div class="message-topic" :title="message.topic">
      {{ renderTopic(message) }}
    </div>

    <div class="message-payload" :title='message.message'>
      <pre>{{ renderMessage(message) }}</pre>
    </div>
  </div>
</template>

<script setup>
  import { parseMessage } from '../message_parser'
  defineProps(["message"])

  const
    renderTopic = ({ topic }) => topic.startsWith("$SYS")
      ? `$SYS/.../${topic.split('/').slice(2).join('/')}`
      : topic,
    renderMessage = message => parseMessage(message)

</script>

<style>
  .message-container {
    border: 1px solid gray;
    border-radius: 10px;
    margin-bottom: 1em;
  }

  .message-topic {
    background-color: rgb(233, 233, 233);
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    padding: 5px 15px;
    border-bottom: 1px solid gray;
  }

  .message-payload {
    /* font-family: monospace; */
    padding: 0 15px;
  }
</style>
