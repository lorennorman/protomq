<template>
  <h3>Protobufs</h3>

  <div v-for="(protos, module) in protosByModule">
    <h4>{{ module }} ({{ protos.length }})</h4>

    <ul>
      <li v-for="protobuf in protos" @click="protobufClicked(protobuf)">
        {{ protobuf.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
  import { protosByModule } from '/frontend/protobuf_service';
  import { useMessageStore } from '/frontend/stores/message'

  const protobufClicked = protobuf => {
    useMessageStore().newMessage(protobuf)
  }
</script>
