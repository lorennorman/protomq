<template>
  <label class="label">
    <p>{{ message.fieldName }}:</p>
    <p>{{ foundMessage?.name }}</p>
  </label>

  <div class="nested-message">
    <FieldInput v-for="field in foundMessage.fields" :field="field"/>
  </div>
</template>

<script setup>
  import { findProtoFor } from '../../protobuf_service';
  import FieldInput from './FieldInput.vue';

  const
    props = defineProps(["message"]),
    foundMessage = findProtoFor(props.message)
</script>

<style>
  .nested-message {
    border: 1px dashed lightgray;
    margin-left: 1.2em;
  }
</style>
