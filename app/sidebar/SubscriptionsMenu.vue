<template>
  <h3>Subscriptions</h3>
  <ul class="subscriptions">
    <li v-if="subscriptionsWithStatus.length <= 0">None</li>
    <li v-for="subscription in subscriptionsWithStatus" :title="subscriptionTitle(subscription)">
      {{ liveStatus(subscription.status) }} {{ subscription.topic }}
    </li>
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
          <li v-for="filter in filters" @click="toggleFilter(filter)">
             {{ filterStatus(filter) }} {{ filter }}
          </li>
          <li><input type="text" v-model="newFilter" @keyup.enter="submitFilter" placeholder="New Filter..."/></li>
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
  import { includes } from 'lodash-es'
  import { ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useSubscriptionStore } from '../stores/subscriptions'

  const
    subscriptionStore = useSubscriptionStore(),
    { subscriptionsWithStatus, rejectedSubscriptions, filters, disabledFilters } = storeToRefs(subscriptionStore),
    { addFilter, toggleFilter } = subscriptionStore,
    hiddenCount = computed(() => rejectedSubscriptions.value.length),
    hideFiltered = ref(true),
    toggleFilterControls = () => hideFiltered.value = !hideFiltered.value,
    filterStatus = filter => includes(disabledFilters.value, filter) ? "❌" : "✅",
    liveStatus = status => status === 'live' ? "⚡" : "🕓",
    subscriptionTitle = sub => `(${sub.status}) ${sub.topic}`,
    newFilter = ref(''),
    submitFilter = () => {
      const filterVal = newFilter.value
      if(filterVal.length > 0) {
        addFilter(filterVal)
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
