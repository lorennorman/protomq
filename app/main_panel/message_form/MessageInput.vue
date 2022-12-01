<template>
  <label class="label">
    <p>{{ message.fieldName }}:</p>
    <p>{{ foundMessage?.name }}</p>
  </label>

  <hr/>
  <MessageFields :message="foundMessage"/>
  <hr/>
</template>

<script setup>
  import { findProtoFor } from '../../protobuf_service';
  import MessageFields from './MessageFields.vue';

  const
    props = defineProps(["message"]),
    foundMessage = findProtoFor(props.message)
</script>
