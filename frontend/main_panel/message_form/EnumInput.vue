<template>
  <label class="label">
    <p>{{ field.fieldName }}:</p>

    <select v-model="vModel">
      <option v-for="option in options" :value="option.value">
        {{ option.key }}
      </option>
    </select>
  </label>
</template>

<script setup>
  import { map } from 'lodash-es'
  import { findProtoFor } from '../../protobuf_service'
  import { useFieldPath } from './use_field_path'

  const
    props = defineProps({
      field: Object,
      fieldPath: String
    }),
    { vModel } = useFieldPath(props),
    enumeration = findProtoFor(props.field),
    options = map(
      enumeration?.values || [],
      (value, key) => ({ key, value })
    )

</script>
