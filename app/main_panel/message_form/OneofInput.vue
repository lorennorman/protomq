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
</template>

<script setup>
  import { computed, provide, ref, watch } from 'vue'
  import { useFieldPath } from './use_field_path'
  import { useMessageStore } from '../../stores/message'

  const
    props = defineProps(["field", "fieldPath"]),
    { setOneOf, clearOneOf } = useMessageStore(),
    { vModel, nextFieldPath } = useFieldPath(props),
    initialIndex = props.field.options.indexOf(vModel.value),
    selectedIndex = ref(initialIndex === -1 ? null : initialIndex),
    selection = computed(() => props.field.options[selectedIndex.value]),
    clearSelection = () => selectedIndex.value = null

  watch(selection, (newSelection, oldSelection) => {
    if(oldSelection) {
      clearOneOf(nextFieldPath, oldSelection)
    }

    if(newSelection) {
      setOneOf(nextFieldPath, newSelection)
    }
  })
</script>

<style scoped>
  button { cursor: pointer; }
</style>
