<template>
  <div class="oneofs">
    <OneofInput v-for="oneof in oneofs" :oneof="oneof" :key="message.name + '-' + oneof.fieldName"/>
  </div>

  <div class="messages">
    <MessageInput v-for="message in messages" :message="message" :key="message.fieldName"/>
  </div>

  <div class="enums">
    <EnumInput v-for="enumer in enums" :enumer="enumer" :key="enumer.fieldName"/>
  </div>

  <div class="primitives">
    <PrimitiveInput v-for="primitive in primitives" :primitive="primitive" :key="primitive.fieldName"/>
  </div>
</template>

<script setup>
  import { filter } from 'lodash-es'
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
    // const messageField = fields(props.message)
    oneofs.value = filter(props.message.fields, { fieldType: 'oneof' })
    messages.value = filter(props.message.fields, { fieldType: 'message' })
    enums.value = filter(props.message.fields, { fieldType: 'enum' })
    primitives.value = filter(props.message.fields, { fieldType: 'primitive' })
  })
</script>
