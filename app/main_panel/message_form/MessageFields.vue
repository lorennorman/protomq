<template>
  <div class="oneofs">
    <OneofInput v-for="oneof in oneofs" :oneof="oneof"/>
  </div>

  <div class="messages">
    <MessageInput v-for="message in messages" :message="message"/>
  </div>

  <div class="enums">
    <EnumInput v-for="enumer in enums" :enumer="enumer"/>
  </div>

  <div class="primitives">
    <PrimitiveInput v-for="primitive in primitives" :primitive="primitive"/>
  </div>
</template>

<script setup>
  import { ref, watchEffect } from 'vue'
  import { fields } from '/app/protobuf_service.js'
  import OneofInput from './OneofInput.vue'
  import EnumInput from './EnumInput.vue'
  import MessageInput from './MessageInput.vue'
  import PrimitiveInput from './PrimitiveInput.vue'

  const
    props = defineProps(["message"]),
    oneofs = ref([]),
    messages = ref([]),
    enums = ref([]),
    primitives = ref([])

  watchEffect(() => {
    const messageField = fields(props.message)
    oneofs.value = messageField.oneofs
    messages.value = messageField.messages
    enums.value = messageField.enums
    primitives.value = messageField.primitives
  })
</script>
