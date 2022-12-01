<template>
  <label v-if="!selection" class="label">
    <p>{{ oneof.fieldName }}:</p>

    <select v-model="selection">
      <option :value="null">Select One:</option>
      <option v-for="option in oneof.options" :value="option">
        {{ option.fieldName }} ({{ option.type?.split('.').at(-1) }})
      </option>
    </select>
  </label>

  <FieldInput v-else :field="selection" />
</template>

<script setup>
  import FieldInput from './FieldInput.vue'
  import { ref, watchEffect } from 'vue'
  defineProps(["oneof"])

  const
    selection = ref(null)
</script>
