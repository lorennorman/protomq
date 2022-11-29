<template>
  <label class="label">
    <p>{{ oneof.fieldName }}:</p>


    <select v-model="selectedType">
      <option :value="null">Select One:</option>
      <option v-for="field in oneof.oneof" :value="field.type">
        {{ field.fieldName }} ({{ field.type?.split('.').at(-1) }})
      </option>
    </select>
  </label>
</template>

<script setup>
  import { ref } from 'vue'

  defineProps(["oneof"])

  const
    selectedType = ref(null)

</script>
