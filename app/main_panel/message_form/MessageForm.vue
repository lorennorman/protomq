<template>
  <div class="message-form">
    <h3>{{ messageType.name }}</h3>

    <blockquote class="description">
      {{ messageType.comment }}
    </blockquote>

    <!-- TODO: repeated -->

    <label class="label">
      <p>Topic:</p>
      <button @click="toggleManualTopic">x</button>
      <input v-if="manualTopic" class="topic-input" type="text" v-model="topicValue"/>
      <select v-else v-model="topicValue">
        <option v-for="subscription in topicOptions" :value="subscription">{{ subscription }}</option>
      </select>
    </label>

    <FieldInput v-for="field in messageFields['']" :field="field" :key="messageType.name + '.' + field.fieldName"/>

    <div class="action-bar">
      <button @click="setMode('messages')">Cancel</button>
      <button @click="publishMessage">Publish</button>
    </div>

    <div>
      <h4>Debug: Protobuf Payload</h4>
      <pre>{{ messageObject }}</pre>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { flatMap, uniq } from 'lodash-es'
  import { useUIStore } from '/app/stores/ui'
  import { useMessageStore } from '/app/stores/message'
  import { useSubscriptionStore } from '/app/stores/subscriptions'
  import { storeToRefs } from 'pinia'
  import FieldInput from './FieldInput.vue'
  import { encodeByName, envelopeLookup } from '/app/protobuf_service'
  import { useMQTTStore } from '/app/stores/mqtt'
  import { topicToMessageName } from '/app/util'

  const
    messageStore = useMessageStore(),
    mqttStore = useMQTTStore(),
    { setMode } = useUIStore(),
    { messageObject, messageType, messageFields } = storeToRefs(messageStore),
    { clearMessage } = messageStore,
    { filteredSubscriptions } = storeToRefs(useSubscriptionStore()),
    topicOptions = computed(() => uniq(flatMap(filteredSubscriptions.value, sub => (
      [ sub, sub.replace('b2d', 'd2b'), sub.replace('d2b', 'b2d')]
    )))),
    topicValue = ref(filteredSubscriptions.value[0]),
    manualTopic = ref(!topicValue.value),
    toggleManualTopic = () => manualTopic.value = !manualTopic.value,
    publishMessage = () => {
      const
        topic = topicValue.value,
        messageName = messageType.value.name,
        messagePayload = messageObject.value,
        { envelopeMessage } = envelopeLookup(messageName, messagePayload),
        messageNameByTopic = topicToMessageName(topic)

      if(messageNameByTopic !== envelopeMessage.name) {
        alert(`Message envelope mismatch!\nTopic expected: ${messageNameByTopic}\nMessage expected: ${envelopeMessage.name}`)
        return
      }

      // protobuf form encode and send PoC working right here
      const encodedMessage = encodeByName(messageName, messagePayload)
      mqttStore.publishMessage(topicValue.value, encodedMessage)
      clearMessage()
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
