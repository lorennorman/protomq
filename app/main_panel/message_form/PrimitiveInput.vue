<template>
  <label class="label">
    <p>{{ primitive.name }}:</p>
    <input :placeholder="primitive.type"/>
  </label>
</template>

<script setup>
  defineProps(["primitive"])
</script>
