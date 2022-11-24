<template>
  <h3>Protobufs</h3>
  <ul class="protobufs">
    <li v-for="protobuf in protobufs" @click="protobufClicked(protobuf)" :title="protobuf.comment">
      {{ protobuf.name }}
    </li>
  </ul>
</template>

<script setup>
  import { useUIStore } from '/app/stores/ui'
  import { useProtobufStore } from '/app/stores/protobufs'
  import { storeToRefs } from 'pinia'

  const
    uiStore = useUIStore(),
    protobufStore = useProtobufStore(),
    { protobufs } = storeToRefs(protobufStore),
    protobufClicked = protobuf => {
      protobufStore.setCurrentProtobuf(protobuf)
      uiStore.setMode('configureMessage')
    }
</script>
