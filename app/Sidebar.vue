<template>
  <h3>Clients</h3>
  <ul class="clients"></ul>
  <h3>Subscriptions</h3>
  <ul class="subscriptions"></ul>
  <h3>Protobufs</h3>
  <ul class="protobufs"></ul>
</template>

<script></script>

<style>
  .sidebar * {
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .sidebar h3 {
    margin-bottom: 5px;
  }

  .sidebar ul {
    margin-top: 0;
    padding-left: initial;
    list-style-position: inside;
    font-size: .9em;
  }
</style>
