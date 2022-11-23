<template>
  <h3>Protobufs</h3>
  <ul class="protobufs">
    <li v-for="protobuf in protobufs" @click="protobufClicked(protobuf)">
      {{ protobuf }}
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
    protobufClicked = protobufName => {
      console.log(protobufName)
      protobufStore.setCurrentProtobuf(protobufName)
      uiStore.setMode('configureMessage')
    }
</script>
