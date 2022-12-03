<template>
  <div class="message-form">
    <h3>{{ messageType.name }}</h3>

    <blockquote class="description">
      {{ messageType.comment }}
    </blockquote>

    <!-- TODO: repeated -->

    <label class="label">
      <p>Topic:</p>
      <input class="topic-input" type="text" v-model="topicValue"/>
    </label>

    <FieldInput v-for="field in messageType.fields" :field="field" :key="messageType.name + field.fieldName"/>

    <div class="action-bar">
      <button @click="setMode('messages')">Cancel</button>
      <button @click="submitMessage()">Submit</button>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useUIStore } from '/app/stores/ui'
  import { useMessageStore } from '/app/stores/message'
  import { storeToRefs } from 'pinia'
  import FieldInput from './FieldInput.vue'
  import { encodeByName } from '/app/protobuf_service'
  import { useMQTTStore } from '/app/stores/mqtt'

  const
    messageStore = useMessageStore(),
    mqttStore = useMQTTStore(),
    { setMode } = useUIStore(),
    { messageObject, messageType, messageEncoded } = storeToRefs(messageStore),
    topicValue = ref(''),
    submitMessage = () => {
      // protobuf form encode and send PoC working right here
      const encodedMessage = encodeByName(messageType.value.name, messageObject.value)
      mqttStore.publishMessage(topicValue.value, encodedMessage)
    }
</script>

<style>
  .message-form {
    max-width: 500px;
  }

  .description {
    font-style: italic;
    color: gray;
  }

  .topic-input {
    width: 100%;
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
