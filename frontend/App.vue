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
   import Sidebar from './sidebar/Sidebar.vue'
   import MainPanel from './main_panel/Main.vue'
</script>

<style>
  body {
    --bg: #fff;
    --bg-header: #f5deb3;
    --bg-sidebar-hover: lightgray;
    --bg-metadata: rgb(233, 233, 233);
    --bg-tag-trigger: #e8f5e9;
    --bg-tag-after: #e3f2fd;
    --bg-edit-btn: #e3f2fd;
    --bg-send-btn: #fff3e0;
    --text: #000;
    --text-muted: gray;
    --border: gray;
    --accent-green: green;
    --color-tag-trigger: #2e7d32;
    --color-tag-after: #1565c0;
    --color-edit-btn: #1565c0;
    --color-send-btn: #ef6c00;

    display: grid;
    grid-template: auto 1fr auto / 550px 1fr;
    height: 100vh;
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    background: var(--bg);
    color: var(--text);
  }

  @media (prefers-color-scheme: dark) {
    body {
      --bg: #1a1a2e;
      --bg-header: #16213e;
      --bg-sidebar-hover: #2a2a4a;
      --bg-metadata: #2a2a4a;
      --bg-tag-trigger: #1b3a1b;
      --bg-tag-after: #1a2a3e;
      --bg-edit-btn: #1a2a3e;
      --bg-send-btn: #3a2a1a;
      --text: #e0e0e0;
      --text-muted: #888;
      --border: #444;
      --accent-green: #4caf50;
      --color-tag-trigger: #66bb6a;
      --color-tag-after: #64b5f6;
      --color-edit-btn: #64b5f6;
      --color-send-btn: #ffb74d;
    }
  }

  header {
    grid-column: 1 / 4;
    background: var(--bg-header);
    padding: 0 2rem;
    border-bottom: 2px solid var(--border);
  }

  .sidebar {
    grid-column: 1 / 2;
    padding: 1rem;
    overflow-y: scroll;
    border-right: 2px solid var(--border);
  }

  main {
    grid-column: 2 / 3;
    padding: 1em;
    overflow-y: scroll;
  }

  footer {
    grid-column: 1 / 4;
    background: var(--bg-header);
    padding: 0 2rem;
    border-top: 2px solid var(--border);
    text-align: center;
  }
</style>
