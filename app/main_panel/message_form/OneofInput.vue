<template>
  <label v-if="!selection" class="label">
    <p>{{ field.fieldName }}:</p>

    <select v-model="selectedIndex">
      <option :value="null">Select One:</option>
      <option v-for="(option, index) in field.options" :value="index">
        {{ option.fieldName }} ({{ option.type?.split('.').at(-1) }})
      </option>
    </select>
  </label>

  <template v-else>
    <button @click="clearSelection">x</button>
    <FieldInput :field="selection" />
  </template>
</template>

<script setup>
  import { computed } from 'vue'
  import FieldInput from './FieldInput.vue'

  const
    props = defineProps(["field", "fieldPath"]),
    selectedIndex = defineModel({ default: 0 }),
    selection = computed(() => props.field.options[selectedIndex.value]),
    clearSelection = () => selectedIndex.value = null
</script>

<style scoped>
 button { cursor: pointer; }
</style>
