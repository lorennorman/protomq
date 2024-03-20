<template>
  <InputComponent v-if="isRepeated" :field="repeatedField" :fieldPath="fieldPath"/>
  <InputComponent v-else :field="field" :fieldPath="fieldPath"/>
</template>

<script setup>
  import { computed } from 'vue'
  import OneofInput from './OneofInput.vue'
  import EnumInput from './EnumInput.vue'
  import MessageInput from './MessageInput.vue'
  import PrimitiveInput from './PrimitiveInput.vue'

  const
    props = defineProps(["field", "fieldPath"]),

    fieldTypeComponentMap = {
      oneof: OneofInput,
      message: MessageInput,
      enum: EnumInput,
      primitive: PrimitiveInput,
    },

    InputComponent = computed(() => fieldTypeComponentMap[props.field.fieldType]),

    isRepeated = computed(() => props.field.rule === 'repeated' ),

    repeatedField = computed(() => ({
      ...props.field,
      fieldName: `${props.field.fieldName}[0]`
    }))
</script>
