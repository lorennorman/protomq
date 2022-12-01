<template>
  <h3>Clients</h3>
  <ul class="clients">
    <li v-for="client in clients">{{ client }}</li>
  </ul>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { useMQTTStore } from '../stores/mqtt'

  const { clients } = storeToRefs(useMQTTStore())
</script>
