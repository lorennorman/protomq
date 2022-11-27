<template>
  <h3>Protobufs</h3>

  <div v-for="(protos, module) in protosByModule">
    <h4>{{ module.split('/').at(-1) }} ({{ protos.length }})</h4>

    <ul>
      <li v-for="protobuf in protos" @click="protobufClicked(protobuf)" :title="protobuf.comment">
        {{ protobuf.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
  import { protosByModule } from '/app/protobuf_service';
  import { useMessageStore } from '/app/stores/message'

  const protobufClicked = protobuf => {
    useMessageStore().newMessage(protobuf)
  }
</script>
