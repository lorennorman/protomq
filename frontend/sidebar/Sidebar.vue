<template>
  <ClientsMenu/>
  <hr/>
  <SubscriptionsMenu/>
  <hr/>
  <ProtobufsMenu/>
</template>

<script setup>
  import ProtobufsMenu from './ProtobufsMenu.vue'
  import ClientsMenu from './ClientsMenu.vue'
  import SubscriptionsMenu from './SubscriptionsMenu.vue'
</script>

<style>
  .sidebar * {
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .sidebar h3, .sidebar h4 {
    margin-bottom: 5px;
  }

  .sidebar ul {
    margin-top: 0;
    padding-left: initial;
    list-style-position: inside;
    font-size: .9em;
  }

  .sidebar li:hover {
    cursor: pointer;
    background-color: lightgray;
  }
</style>
