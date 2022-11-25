<template>
  <label class="label">
    <p>{{ enumer.name }}:</p>
    <input :placeholder="enumer.type"/>
  </label>
</template>

<script setup>
  defineProps(["enumer"])
</script>
