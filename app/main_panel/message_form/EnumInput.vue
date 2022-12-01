<template>
  <label class="label">
    <p>{{ enumer.fieldName }}:</p>

    <select>
      <option v-for="option in options" :value="option.value">
        {{ option.key }}
      </option>
    </select>
  </label>
</template>

<script setup>
  import { map } from 'lodash-es'
  import { findProtoFor } from '../../protobuf_service'

  const
    props = defineProps(["enumer"]),
    enumeration = findProtoFor(props.enumer),
    options = map(
      enumeration?.values || [],
      (value, key) => ({ key, value })
    )
</script>
