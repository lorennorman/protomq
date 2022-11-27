<template>
  <div class="oneofs">
    <OneofInput v-for="oneof in messageFields.oneofs" :oneof="oneof"/>
  </div>

  <div class="messages">
    <MessageInput v-for="message in messageFields.messages" :message="message"/>
  </div>

  <div class="enums">
    <EnumInput v-for="enumer in messageFields.enums" :enumer="enumer"/>
  </div>

  <div class="primitives">
    <PrimitiveInput v-for="primitive in messageFields.primitives" :primitive="primitive"/>
  </div>
</template>

<script setup>
  import { fields } from '/app/protobuf_service.js'
  import OneofInput from './OneofInput.vue'
  import EnumInput from './EnumInput.vue'
  import MessageInput from './MessageInput.vue'
  import PrimitiveInput from './PrimitiveInput.vue'

  const
    props = defineProps(["message"]),
    messageFields = fields(props.message)
</script>
