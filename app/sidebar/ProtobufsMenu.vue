<template>
  <h3>Protobufs</h3>
  <div v-for="module in reverse(protobufModules)">
    <h4>{{ module.split('/').at(-1) }} ({{ protobufsByModule(module).length }})</h4>
    <ul>
      <li v-for="protobuf in protobufsByModule(module)" @click="protobufClicked(protobuf)" :title="protobuf.comment">
        {{ protobuf.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
  import { filter, reverse } from 'lodash-es'
  import { useProtobufStore } from '/app/stores/protobufs'
  import { useMessageStore } from '/app/stores/message'
  import { storeToRefs } from 'pinia'

  const
    protobufStore = useProtobufStore(),
    messageStore = useMessageStore(),
    { protobufs, protobufModules } = storeToRefs(protobufStore),
    protobufClicked = protobuf => {
      messageStore.newMessage(protobuf)
    },
    protobufsByModule = module => filter(protobufs.value, { filename: module })
</script>
