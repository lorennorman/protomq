<template>
  <h3>{{ message.name }}</h3>

  <blockquote class="description">
    {{ message.comment }}
  </blockquote>

  <!-- TODO: repeated -->

  <MessageFields :message="message"/>

  <div class="action-bar">
    <button @click="setMode('messages')">Cancel</button>
    <button @click="">Submit</button>
  </div>
</template>

<script setup>
  import { useUIStore } from '/app/stores/ui'
  import { useMessageStore } from '/app/stores/message'
  import { storeToRefs } from 'pinia'
  import MessageFields from './MessageFields.vue'

  const
    messageStore = useMessageStore(),
    { setMode } = useUIStore(),
    { message } = storeToRefs(messageStore)
</script>

<style>
  .description {
    font-style: italic;
    color: gray;
  }

  .label {
    display: flex;
    gap: 1em;
    font-family: monospace;
  }

  .label p {
    min-width: 150px;
    text-align: right;
  }

  .action-bar {
    margin-top: 2em;
    max-width: 500px;
    display: flex;
    gap: 1em;
    justify-content: space-around;
  }

  .action-bar button {
    font-size: 1.5em;
    font-weight: 600;
    color: white;
    background-color: hsl(31, 28%, 53%);
    padding: 10px 15px;
    border-radius: 15px;
  }

  .action-bar button:hover {
    cursor: pointer;
    background-color: hsl(31, 28%, 45%);
  }
</style>
