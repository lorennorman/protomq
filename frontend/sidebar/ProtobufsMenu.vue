<template>
  <h3>Protobufs</h3>

  <div class="proto-version" v-for="section in sections" :key="section.version">
    <h4 class="section-toggle" @click="open[section.version] = !open[section.version]">
      {{ open[section.version] ? '&#9660;' : '&#9654;' }}
      {{ section.label }} ({{ count(section.modules) }})
    </h4>

    <div v-if="open[section.version]" class="proto-modules">
      <p v-if="count(section.modules) === 0" class="empty-label">None loaded</p>
      <div v-for="(protos, module) in section.modules" :key="module">
        <h5>{{ module }} ({{ protos.length }})</h5>
        <ul>
          <li v-for="protobuf in protos" :key="protobuf.type" @click="protobufClicked(protobuf)">
            {{ protobuf.name }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { reactive, computed } from 'vue'
  import { protosByModuleV1, protosByModuleV2 } from '/frontend/protobuf_service';
  import { useMessageStore } from '/frontend/stores/message'

  // V2 expanded by default, V1 collapsed beneath it.
  const open = reactive({ v2: true, v1: false })

  const sections = computed(() => [
    { version: 'v2', label: 'V2', modules: protosByModuleV2.value },
    { version: 'v1', label: 'V1 (legacy)', modules: protosByModuleV1.value },
  ])

  const count = modules => Object.values(modules).reduce((n, list) => n + list.length, 0)

  const protobufClicked = protobuf => {
    useMessageStore().newMessage(protobuf)
  }
</script>

<style>
  .proto-version .section-toggle {
    cursor: pointer;
    user-select: none;
  }

  .proto-version .section-toggle:hover {
    opacity: 0.8;
  }

  .proto-modules {
    margin-left: 0.5em;
  }

  .proto-modules h5 {
    margin: 0.4em 0 0.1em;
    color: var(--text-muted);
  }

  .proto-version li {
    cursor: pointer;
  }

  .proto-version li:hover {
    background-color: var(--bg-sidebar-hover);
  }

  .empty-label {
    color: var(--text-muted);
    font-style: italic;
    font-size: 0.8em;
    margin: 0.2em 0;
  }
</style>
