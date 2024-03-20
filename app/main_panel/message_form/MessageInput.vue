<template>
  <label class="label">
    <p>{{ field.fieldName }}:</p>
    <p>{{ foundMessage?.name }}</p>
  </label>

  <div class="nested-message">
    <FieldInput v-for="messageField in messageFields" :field="messageField" :fieldPath="nextFieldPath" :key="messageField.fieldName"/>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { findProtoFor } from '../../protobuf_service'
  import { useMessageStore } from '../../stores/message'
  import FieldInput from './FieldInput.vue'
  import { useFieldPath } from './use_field_path'

  const
    props = defineProps({
      field: Object,
      fieldPath: String
    }),
    { getFieldsAtPath } = useMessageStore(),
    { nextFieldPath } = useFieldPath(props),
    foundMessage = computed(() => findProtoFor(props.field)),
    messageFields = computed(() => getFieldsAtPath(nextFieldPath))
</script>

<style>
  .nested-message {
    border: 1px dashed lightgray;
    margin-left: 1.2em;
  }
</style>
