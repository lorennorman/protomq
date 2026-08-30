<template>
  <div class="label">
    <p>
      <button v-if="!expanded" @click="addMessage" class="add-msg-btn">+</button>
      <button v-else @click="removeMessage" class="add-msg-btn">-</button>
      {{ (label ?? field.fieldName) || label }}:
    </p>
    <p>{{ foundMessage?.name }}</p>
  </div>

  <div v-if="expanded" class="nested-message">
    <FieldInput v-for="messageField in messageFields" :field="messageField" :fieldPath="nextFieldPath" :key="messageField.fieldName"/>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { findProtoFor } from '../../protobuf_service'
  import { useMessageStore } from '../../stores/message'
  import FieldInput from './FieldInput.vue'
  import { useFieldPath } from './use_field_path'

  const
    props = defineProps({
      label: String,
      field: Object,
      fieldPath: String
    }),
    messageStore = useMessageStore(),
    { getFieldsAtPath } = messageStore,
    { nextFieldPath } = useFieldPath(props),
    foundMessage = computed(() => findProtoFor(props.field)),
    messageFields = computed(() => getFieldsAtPath(nextFieldPath)),
    expanded = ref(messageStore.getDeep(nextFieldPath) !== undefined),

    addMessage = () => {
      messageStore.setDeep(nextFieldPath, {})
      const proto = foundMessage.value
      if (proto) messageStore.setDefaults(proto, nextFieldPath)
      expanded.value = true
    },

    removeMessage = () => {
      messageStore.setDeep(nextFieldPath, undefined)
      expanded.value = false
    }
</script>

<style>
  .nested-message {
    border: 1px dashed var(--border);
    margin-left: 1.2em;
  }

  .add-msg-btn {
    font-size: 0.8em;
    padding: 0 4px;
    cursor: pointer;
    font-family: monospace;
  }
</style>
