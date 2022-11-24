<template>
  <label :for="field.name">
    {{ field.name }}:
    <input :id="field.name" type="text" value="" :placeholder="niceType"/>
  </label>
</template>

<script setup>
  import { computed } from 'vue'

  const props = defineProps(['field'])
  const niceType = computed(() => props.field.type.split('.').at(-1))

</script>
