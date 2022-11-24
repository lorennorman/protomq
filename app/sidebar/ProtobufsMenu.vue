<template>
  <h3>Protobufs</h3>
  <div v-for="module in reverse(protobufModules)">
    <h4>{{ module.split('/').at(-1) }}</h4>
    <ul>
      <li v-for="protobuf in protobufsByModule(module)" @click="protobufClicked(protobuf)" :title="protobuf.comment">
        {{ protobuf.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
  import { filter, reverse } from 'lodash-es'
  import { useUIStore } from '/app/stores/ui'
  import { useProtobufStore } from '/app/stores/protobufs'
  import { storeToRefs } from 'pinia'

  const
    uiStore = useUIStore(),
    protobufStore = useProtobufStore(),
    { protobufs, protobufModules } = storeToRefs(protobufStore),
    protobufClicked = protobuf => {
      protobufStore.setCurrentProtobuf(protobuf)
      uiStore.setMode('configureMessage')
    },
    protobufsByModule = module => filter(protobufs.value, { filename: module })
</script>
