<template>
  <h3>{{ message.name }}</h3>

  <blockquote class="description">{{ message.comment }}</blockquote>

  <!-- TODO: repeated -->

  <div class="oneofs">
    <OneofInput v-for="oneof in oneofs" :oneof="oneof"/>
  </div>

  <div class="messages">
    <MessageInput v-for="message in messages" :message="message"/>
  </div>

  <div class="enums">
    <EnumInput v-for="enumer in enums" :enumer="enumer"/>
  </div>

  <div class="primitives">
    <PrimitiveInput v-for="primitive in primitives" :primitive="primitive"/>
  </div>

  <div class="action-bar">
    <button @click="setMode('messages')">Cancel</button>
    <button @click="">Submit</button>
  </div>
</template>

<script setup>
  import { useUIStore } from '/app/stores/ui'
  import { useMessageStore } from '/app/stores/message'
  import { storeToRefs } from 'pinia'
  import OneofInput from './OneofInput.vue'
  import EnumInput from './EnumInput.vue'
  import MessageInput from './MessageInput.vue'
  import PrimitiveInput from './PrimitiveInput.vue'

  const
    { setMode } = useUIStore(),
    { message, oneofs, messages, enums, primitives } = storeToRefs(useMessageStore())
</script>

<style scoped>
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
