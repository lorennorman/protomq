<template>
  <h3>Configure a {{ currentProtobuf }} Message</h3>

  <input v-for="field in currentProtobufFields" type="text" :value="field"/>

  <button @click="setMode('messages')">Cancel</button>
  <button @click="">Submit</button>
</template>

<script setup>
  import { useUIStore } from '../stores/ui'
  import { useProtobufStore } from '../stores/protobufs'
  import { storeToRefs } from 'pinia'

  const
    { setMode } = useUIStore(),
    { currentProtobuf, currentProtobufFields } = storeToRefs(useProtobufStore())
</script>

<style>
  main input {
    display: block;
  }
</style>
