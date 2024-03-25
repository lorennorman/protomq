<template>
  <div class="message-container">
    <div class="message-metadata" :title="message.topic">
      <span class="message-name">{{ prettyMessageName }}</span>
      ➡️
      <span class="message-topic">{{ prettyTopic }}</span>
    </div>

    <div class="message-payload" :title='message.message'>
      <pre>{{ prettyMessageBody }}</pre>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { topicToMessageName } from '../util'
  import { parseMessage } from '../message_parser'

  const
    props = defineProps(["message"]),
    prettyTopic = computed(() => {
      const topic = props.message.topic

      return topic.startsWith("$SYS")
        ? `$SYS/.../${topic.split('/').slice(2).join('/')}`
        : topic
    }),
    prettyMessageName = computed(() => topicToMessageName(props.message.topic)),
    prettyMessageBody = computed(() => parseMessage(props.message))
</script>

<style>
  .message-container {
    border: 1px solid gray;
    border-radius: 10px;
    margin-bottom: 1em;
  }

  .message-metadata {
    background-color: rgb(233, 233, 233);
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    padding: 5px 15px;
    border-bottom: 1px solid gray;
  }

  .message-name {
    font-weight: 600;
  }

  .message-topic {
    color: gray;
    font-size: .8em;
  }

  .message-payload {
    /* font-family: monospace; */
    padding: 0 15px;
  }
</style>
