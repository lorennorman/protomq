<template>
  <label class="label">
    <p>{{ oneof.fieldName }}:</p>

    <template v-if="selection">
      <h5>{{ selectedType }}</h5>
    </template>
    <select v-else v-model="selection">
      <option :value="null">Select One:</option>
      <option v-for="field in oneof.oneof" :value="field">
        {{ field.fieldName }} ({{ field.type?.split('.').at(-1) }})
      </option>
    </select>
  </label>
</template>

<script setup>
  import { ref, watch, watchEffect } from 'vue'
  import { findProtoFor } from '/app/protobuf_service'
  defineProps(["oneof"])

  const
    selection = ref(null),
    selectedType = ref(null)

  watchEffect(() => {
    selectedType.value = selection.value
      ? findProtoFor(selection.value)
      : null
  })
</script>
