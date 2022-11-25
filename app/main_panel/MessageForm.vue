<template>
  <h3>Configure a {{ message.name }} Message</h3>

  <blockquote class="description">{{ message.comment }}</blockquote>

  <!-- oneofs -->
  <h5>oneofs</h5>
  <label class="label" v-for="oneof in oneofs">
    <p>{{ oneof.name }}:</p>
    <select>
      <option v-for="field in oneof.fieldsArray" :id="field.type">
        {{ field.name }} ({{ field.type.split('.').at(-1) }})
      </option>
    </select>
  </label>

  <!-- messages -->
  <h5>messages</h5>
  <label class="label" v-for="msg in messages">
    <p>{{ msg.name }}:</p>
    <input :placeholder="msg.type"/>
  </label>

  <!-- enums -->
  <h5>enums</h5>
  <label class="label" v-for="enumer in enums">
    <p>{{ enumer.name }}:</p>
    <input :placeholder="enumer.type"/>
  </label>

  <h5>primitives</h5>
  <!-- primitives -->
  <label class="label" v-for="primitive in primitives">
    <p>{{ primitive.name }}:</p>
    <input :placeholder="primitive.type"/>
  </label>

  <!-- each with repeated -->

  <!-- <FieldInput :field="field" v-for="field in message.fields"/> -->

  <div class="action-bar">
    <button @click="setMode('messages')">Cancel</button>
    <button @click="">Submit</button>
  </div>
</template>

<script setup>
  import { useUIStore } from '../stores/ui'
  import { useMessageStore } from '../stores/message'
  import { storeToRefs } from 'pinia'
  import FieldInput from './FieldInput.vue';

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
