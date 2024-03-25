<template>
  <h3>Clients</h3>
  <ul class="clients">
    <li v-for="client in clients">{{ renderClient(client) }}</li>
  </ul>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { useMQTTStore } from '../stores/mqtt'

  const
    { clientId, clients } = storeToRefs(useMQTTStore()),
    renderClient = clientToRender => {
      if(clientToRender === clientId.value) {
        return `${clientToRender} (you)`
      }

      return clientToRender
    }
</script>
