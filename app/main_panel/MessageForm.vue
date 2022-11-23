<template>
  <h3>Message Form</h3>
  <input type="text" value="boo"/>
  <button @click="setMode('messages')">Cancel</button>
  <button @click="">Submit</button>
</template>

<script setup>
  import { useUIStore } from '../stores/ui'

  const { setMode } = useUIStore()
</script>

<style>
</style>
