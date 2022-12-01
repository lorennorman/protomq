<template>
  <OneofInput v-if="fieldType === 'oneof'" :oneof="field"/>
  <MessageInput v-else-if="fieldType === 'message'" :message="field"/>
  <EnumInput v-else-if="fieldType === 'enum'" :enumer="field"/>
  <PrimitiveInput v-else-if="fieldType === 'primitive'" :primitive="field"/>
</template>

<script setup>
  import { ref, watchEffect } from 'vue'
  import OneofInput from './OneofInput.vue'
  import EnumInput from './EnumInput.vue'
  import MessageInput from './MessageInput.vue'
  import PrimitiveInput from './PrimitiveInput.vue'

  const
    props = defineProps(["field"]),
    fieldType = ref(props.field.fieldType)
</script>
