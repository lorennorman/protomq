<template>
  <label class="label">
    <p>{{ field.fieldName }}:</p>

    <button v-if="selection" @click="clearSelection">x</button>

    <select v-model="selectedIndex">
      <option :value="null">One Of:</option>
      <option v-for="(option, index) in field.options" :value="index">
        {{ option.fieldName }} ({{ option.type?.split('.').at(-1) }})
      </option>
    </select>
  </label>

  <FieldInput v-if="selection" :field="selection" />

</template>

<script setup>
  import { computed, provide } from 'vue'
  import FieldInput from './FieldInput.vue'

  provide('hideMessageLabel', true)

  const
    props = defineProps(["field", "fieldPath"]),
    selectedIndex = defineModel({ default: null }),
    selection = computed(() => props.field.options[selectedIndex.value]),
    clearSelection = () => selectedIndex.value = null
</script>

<style scoped>
  button { cursor: pointer; }
</style>
