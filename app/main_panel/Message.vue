<template>
  <div class="message-container">
    <div class="message-topic" :title="message.topic">
      {{ prettyTopic }}
    </div>

    <div class="message-payload" :title='message.message'>
      <pre>{{ prettyMessage }}</pre>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { parseMessage } from '../message_parser'

  const
    props = defineProps(["message"]),
    prettyTopic = computed(() => {
      const topic = props.message.topic

      return topic.startsWith("$SYS")
        ? `$SYS/.../${topic.split('/').slice(2).join('/')}`
        : topic
    }),
    prettyMessage = computed(() => parseMessage(props.message))

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
