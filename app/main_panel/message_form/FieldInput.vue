<template>
  <template v-if="repeated">
    <InputComponent :field="repeatedField"/>
  </template>
  <InputComponent v-else :field="field"/>
</template>

<script setup>
  import { computed } from 'vue'
  import OneofInput from './OneofInput.vue'
  import EnumInput from './EnumInput.vue'
  import MessageInput from './MessageInput.vue'
  import PrimitiveInput from './PrimitiveInput.vue'

  const
    props = defineProps(["field"]),
    fieldTypeComponentMap = {
      oneof: OneofInput,
      message: MessageInput,
      enum: EnumInput,
      primitive: PrimitiveInput,
    },
    InputComponent = computed(() =>
      fieldTypeComponentMap[props.field.fieldType]
    ),
    repeated = computed(() => props.field.rule === 'repeated' ),
    repeatedField = computed(() => {
      return { ...props.field, fieldName: `${props.field.fieldName}[0]` }
    })
</script>
