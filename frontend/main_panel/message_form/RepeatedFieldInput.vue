<template>
  <div class="repeated-field">
    <label class="label">
      <p>
        <button @click="addItem" :disabled="addDisabled">+</button>
        <button v-if="any" @click="removeItem">-</button>
        <span>repeated:</span>
      </p>

      <p>{{ field.fieldName }}</p>

      <span v-if="maxCount" class="nanopb-hint" :class="{ 'limit-exceeded': limitExceeded }">
        {{ items.length }}/{{ maxCount }}
      </span>
    </label>

    <InputComponent v-for="(item, index) in items" :field="item" :fieldPath="fieldPath" :label="String(index)"/>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { cloneDeep } from 'lodash-es'
  import OneofInput from './OneofInput.vue'
  import EnumInput from './EnumInput.vue'
  import MessageInput from './MessageInput.vue'
  import PrimitiveInput from './PrimitiveInput.vue'
  import { useMessageStore } from '../../stores/message'
  import { useFieldPath } from './use_field_path'
  import { useUIStore } from '../../stores/ui'
  import { storeToRefs } from 'pinia'


  const
    props = defineProps(["field", "fieldPath"]),
    { setDeep, popDeep } = useMessageStore(),
    { nextFieldPath } = useFieldPath(props),

    items = ref([]),

    addItem = () => {
      // clone the field, append the array index to the name
      const newItem = cloneDeep(props.field)
      newItem.fieldName += `[${items.value.length}]`
      // make a path for the message
      const itemFieldPath = nextFieldPath + `[${items.value.length}]`
      // set the collection on the message
      setDeep(itemFieldPath, null)
      // add to our local item
      items.value.push(newItem)
    },

    removeItem = () => {
      // pop our collection
      items.value.pop()
      // and the message
      popDeep(nextFieldPath)
    },

    any = computed(() => items.value.length > 0),

    { enforceNanopbLimits } = storeToRefs(useUIStore()),
    maxCount = computed(() => props.field.options?.max_count),
    limitExceeded = computed(() =>
      enforceNanopbLimits.value && maxCount.value && items.value.length > maxCount.value
    ),
    addDisabled = computed(() =>
      enforceNanopbLimits.value && maxCount.value && items.value.length >= maxCount.value
    ),

    fieldTypeComponentMap = {
      oneof: OneofInput,
      message: MessageInput,
      enum: EnumInput,
      primitive: PrimitiveInput,
    },

    InputComponent = computed(() => fieldTypeComponentMap[props.field.fieldType])

  // Only auto-add one item if a value already exists at this path.
  // In newMessage flow, setDefaults populates repeated fields before mount.
  // In loadFromData flow, fields not in the data are undefined — skip auto-add.
  if (useMessageStore().getDeep(nextFieldPath) !== undefined) {
    addItem()
  }
</script>

<style>
  .repeated-field {
    border: 1px dashed var(--border);
    margin-left: 1.2em;
  }
  .nanopb-hint {
    font-size: 0.8em;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .nanopb-hint.limit-exceeded {
    color: #d32f2f;
    font-weight: bold;
  }
</style>
