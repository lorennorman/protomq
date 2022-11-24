<template>
  <h3>Configure a {{ currentProtobuf.name }} Message</h3>

  <p>{{ currentProtobuf.comment }}</p>
  <FieldInput :field="field" v-for="field in currentProtobuf.fields"/>

  <button @click="setMode('messages')">Cancel</button>
  <button @click="">Submit</button>
</template>

<script setup>
  import { useUIStore } from '../stores/ui'
  import { useProtobufStore } from '../stores/protobufs'
  import { storeToRefs } from 'pinia'
  import FieldInput from './FieldInput.vue';

  const
    { setMode } = useUIStore(),
    { currentProtobuf, currentProtobufFields } = storeToRefs(useProtobufStore())
</script>

<style>
  main input {
    display: block;
  }
</style>
