<template>
  <label class="label">
    <p>{{ enumer.fieldName }}:</p>

    <select>
      <option v-for="option in options" :id="option.id">
        {{ option.value }}
      </option>
    </select>
  </label>
</template>

<script setup>
  import { map } from 'lodash-es'

  const
    props = defineProps(["enumer"]),
    options = map(
      props.enumer?.values || [],
      (value, key) => ({ id: value, value: key })
    )
</script>
