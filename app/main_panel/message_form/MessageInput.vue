<template>
  <label class="label">
    <p>m: {{ message.fieldName }}:</p>
    <p>{{ message.name }}</p>
  </label>

  <hr/>
  <MessageFields :message="message"/>
  <hr/>
</template>

<script setup>
  import MessageFields from './MessageFields.vue';
  defineProps(["message"])
</script>
