<template>
  <h3>Subscriptions</h3>
  <ul class="subscriptions">
    <li v-for="subscription in subscriptions">{{ subscription }}</li>
  </ul>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { useMQTTStore } from '../stores/mqtt'

  const { subscriptions } = storeToRefs(useMQTTStore())
</script>
