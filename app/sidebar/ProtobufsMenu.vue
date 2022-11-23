<template>
  <h3>Protobufs</h3>
  <ul class="protobufs">
    <li v-for="protobuf in protobufs" @click="protobufClicked(protobuf)">
      {{ protobuf }}
    </li>
  </ul>
</template>

<script setup>
  import PB from '/protobufs'
  import { useUIStore } from '/app/stores/ui'

  const
    store = useUIStore(),
    protobufs = Object.keys(PB),
    protobufClicked = protobufName => {
      console.log(protobufName)
      store.setMode('configureMessage')
    }
</script>
