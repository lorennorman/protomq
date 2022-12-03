<template>
  <label v-if="!selection" class="label">
    <p>{{ field.fieldName }}:</p>

    <select v-model="selection">
      <option :value="null">Select One:</option>
      <option v-for="option in field.options" :value="option">
        {{ option.fieldName }} ({{ option.type?.split('.').at(-1) }})
      </option>
    </select>
  </label>

  <FieldInput v-else :field="selection" />
</template>

<script setup>
  import { ref } from 'vue'
  import FieldInput from './FieldInput.vue'

  const
    props = defineProps(["field"]),
    selection = ref(null)
</script>
