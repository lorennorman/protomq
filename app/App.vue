<template>
  <header>
    <h1>ProtoMQ</h1>
  </header>

  <div class="sidebar">
    <Sidebar/>
  </div>

  <main>
    <MainPanel/>
  </main>

  <footer>
    <p>Written in the open, with ❤️, by people who care.</p>
  </footer>
</template>

<script setup>
   import Sidebar from './Sidebar.vue'
   import MainPanel from './Main.vue'
</script>

<style>
  body {
    display: grid;
    grid-template: auto 1fr auto / 250px 1fr;
    height: 100vh;
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
  }

  header {
    grid-column: 1 / 4;
    background: #f5deb3;
    padding: 0 2rem;
    border-bottom: 2px solid gray;
  }

  .sidebar {
    grid-column: 1 / 2;
    padding: 1rem;
    overflow-y: scroll;
    border-right: 2px solid gray;
  }

  main {
    grid-column: 2 / 3;
    padding: 1em;
    overflow-y: scroll;
  }

  footer {
    grid-column: 1 / 4;
    background: wheat;
    padding: 0 2rem;
    border-top: 2px solid gray;
    text-align: center;
  }
</style>
