<template>
  <h3>Subscriptions</h3>
  <ul class="subscriptions">
    <li v-if="filteredSubscriptions.length <= 0">None</li>
    <li v-for="subscription in filteredSubscriptions">{{ subscription }}</li>
  </ul>

  <div class="filter-panel">
    <template v-if="hideFiltered">
      <p class="hidden-label" @click="toggleFilterControls">
        {{ hiddenCount }} hidden
      </p>
    </template>

    <template v-else>
      <div class="filter-controls">
        <span class="close-controls" @click="toggleFilterControls">X</span>
        <p class="list-label">Filters:</p>
        <ul>
          <li v-for="filter in filterList" @click="toggleFilter(filter)">
             {{ filterStatus(filter) }} {{ filter }}
          </li>
          <li><input type="text" v-model="newFilter" @keyup.enter="addFilter" placeholder="New Filter..."/></li>
        </ul>

        <p class="list-label">Filtered Subscriptions:</p>
        <ul>
          <li v-for="subscription in rejectedSubscriptions">
            {{ subscription }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { filter, includes, reject, some, without } from 'lodash-es'
  import { ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useMQTTStore } from '../stores/mqtt'

  const
    { subscriptions } = storeToRefs(useMQTTStore()),
    filterList = ref(["#", "$SYS/*"]),
    disabledFilters = ref(["#"]),
    activeFilters = computed(() => without(filterList.value, ...disabledFilters.value)),
    filteredSubscriptions = computed(() => reject(subscriptions.value, sub =>
      some(activeFilters.value, filter =>
        (filter.endsWith('*') && sub.startsWith(filter.slice(0, -1)))
          || (filter === sub)
      )
    )),
    rejectedSubscriptions = computed(() => without(subscriptions.value, ...filteredSubscriptions.value)),
    hiddenCount = computed(() => rejectedSubscriptions.value.length),
    hideFiltered = ref(true),
    toggleFilterControls = () => hideFiltered.value = !hideFiltered.value,
    toggleFilter = filter => {
      includes(disabledFilters.value, filter)
        ? disabledFilters.value = without(disabledFilters.value, filter)
        : disabledFilters.value.push(filter)
    },
    filterStatus = filter => includes(disabledFilters.value, filter) ? "❌" : "✅",
    newFilter = ref(''),
    addFilter = () => {
      const filterVal = newFilter.value
      if(filterVal.length > 0) {
        filterList.value.push(filterVal)
        newFilter.value = ''
      }
    }
</script>

<style>
  .filter-panel {
    position: relative;
  }

  .close-controls {
    position: absolute;
    top: 5px;
    right: 5px;
  }

  .filter-panel p {
    font-size: .8em;
    margin: 0;
  }

  .filter-controls {
    border: solid 1px gray;
    padding: 5px;
  }

  .hidden-label {
    color: gray;
    font-style: italic;
  }

  .hidden-label:hover, .close-controls:hover {
    cursor: pointer;
    background-color: lightgray;
  }

  .list-label {
    text-decoration: underline;
  }
</style>
