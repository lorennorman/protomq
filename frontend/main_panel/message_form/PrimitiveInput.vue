<template>
  <label class="label">
    <p>{{ (label ?? field.fieldName) || label }}:</p>

    <input :type="inputType" v-model="vModel" :class="{ 'limit-exceeded': limitExceeded }"/>

    <span v-if="maxSize" class="nanopb-hint" :class="{ 'limit-exceeded': limitExceeded }">
      {{ currentLength }}/{{ maxSize }}
    </span>
  </label>
</template>

<script setup>
  import { computed } from 'vue'
  import { useFieldPath } from './use_field_path'
  import { useUIStore } from '../../stores/ui'
  import { storeToRefs } from 'pinia'

  const
    props = defineProps({
      label: String,
      field: Object,
      fieldPath: String
    }),
    { vModel } = useFieldPath(props),
    { enforceNanopbLimits } = storeToRefs(useUIStore()),
    inputType = computed(() => {
      switch(props.field.type) {
        case "int32":
        case "uint32":
        case "float":
          return "number"
        case "bool":
          return "checkbox"
        default:
          return "text"
      }
    }),
    maxSize = computed(() => props.field.options?.max_size),
    currentLength = computed(() => String(vModel.value ?? '').length),
    limitExceeded = computed(() =>
      enforceNanopbLimits.value && maxSize.value && currentLength.value > maxSize.value
    )
</script>

<style scoped>
  .nanopb-hint {
    font-size: 0.8em;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .nanopb-hint.limit-exceeded {
    color: #d32f2f;
    font-weight: bold;
  }
  input.limit-exceeded {
    outline: 2px solid #d32f2f;
  }
</style>
