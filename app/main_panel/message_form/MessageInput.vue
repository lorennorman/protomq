<template>
  <label v-if="!hideMessageLabel" class="label">
    <p>{{ field.fieldName }}:</p>
    <p>{{ foundMessage?.name }}</p>
  </label>

  <div class="nested-message">
    <FieldInput v-for="messageField in foundMessage.fields" :field="messageField" :fieldPath="nextFieldPath" :key="messageField.fieldName"/>
  </div>
</template>

<script setup>
  import { computed, inject, provide } from 'vue'
  import { findProtoFor } from '../../protobuf_service'
  import FieldInput from './FieldInput.vue'
  import { useFieldPath } from './use_field_path';

  provide('hideMessageLabel', false)

  const
    props = defineProps({
      field: Object,
      fieldPath: String
    }),
    hideMessageLabel = inject('hideMessageLabel', false),
    { nextFieldPath } = useFieldPath(props),
    foundMessage = computed(() => findProtoFor(props.field))
</script>

<style>
  .nested-message {
    border: 1px dashed lightgray;
    margin-left: 1.2em;
  }
</style>
