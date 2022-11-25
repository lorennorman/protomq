<template>
  <label class="label">
    <p>{{ message.name }}:</p>
    <input :placeholder="message.type"/>
  </label>
</template>

<script setup>
  defineProps(["message"])
</script>
