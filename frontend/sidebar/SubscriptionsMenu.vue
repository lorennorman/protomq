<template>
  <div class="subscriptions">
    <div class="section-header">
      <h3 class="section-toggle" @click="sectionOpen = !sectionOpen">
        {{ sectionOpen ? '&#9660;' : '&#9654;' }} Subscriptions
      </h3>
      <span class="header-controls" @click.stop>
        <select class="mode-select" :value="subscriptionMode" @change="setSubscriptionMode($event.target.value)">
          <option v-for="(mode, key) in SUBSCRIPTION_MODES" :key="key" :value="key">
            {{ mode.label }}
          </option>
        </select>
        <button class="clear-btn" @click="clearRecentSubscriptions" title="Clear stale subscriptions">Clear Recent Topics</button>
      </span>
    </div>

    <div v-if="sectionOpen">

      <ul>
        <li v-if="subscriptionsWithStatus.length <= 0">None</li>
        <li v-for="subscription in subscriptionsWithStatus" :title="subscriptionTitle(subscription)">
          {{ liveStatus(subscription.status) }} {{ subscription.topic }}
        </li>
      </ul>

      <div class="filter-panel">
        <template v-if="hideFiltered">
          <p class="hidden-label click-affordance" @click="toggleFilterControls">
            {{ hiddenCount }} hidden
          </p>
        </template>

        <template v-else>
          <div class="filter-controls">
            <span class="close-controls click-affordance" @click="toggleFilterControls">X</span>
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
    </div>
  </div>
</template>

<script setup>
  import { includes } from 'lodash-es'
  import { ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useSubscriptionStore } from '../stores/subscriptions'
  import { SUBSCRIPTION_MODES } from '../stores/subscriptions'

  const
    subscriptionStore = useSubscriptionStore(),
    { subscriptionsWithStatus, rejectedSubscriptions, filters, disabledFilters, subscriptionMode } = storeToRefs(subscriptionStore),
    { addFilter, toggleFilter, setSubscriptionMode, clearRecentSubscriptions } = subscriptionStore,
    sectionOpen = ref(true),
    hiddenCount = computed(() => rejectedSubscriptions.value.length),
    hideFiltered = ref(true),
    toggleFilterControls = () => hideFiltered.value = !hideFiltered.value,
    filterStatus = filter => includes(disabledFilters.value, filter) ? "❌" : "✅",
    liveStatus = status => status === 'live' ? "⚡" : status === 'other' ? "👤" : "🕓",
    statusLabel = { live: 'subscribed', other: 'other client subscribed', recent: 'recent' },
    subscriptionTitle = sub => `(${statusLabel[sub.status]}) ${sub.topic}`,
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
  .subscriptions li {
    list-style: none;
  }

  .section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.4em;
  }

  .subscriptions .section-toggle {
    cursor: pointer;
    user-select: none;
    flex-shrink: 0;
  }

  .subscriptions .section-toggle:hover {
    opacity: 0.8;
  }

  .header-controls {
    display: flex;
    align-items: flex-end;
    gap: 0.3em;
    margin-bottom: 4px;
  }

  .clear-btn, .mode-select {
    font-size: 0.7em;
    padding: 1px 4px;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 3px;
  }

  .clear-btn {
    cursor: pointer;
    color: var(--text-muted);
  }

  .clear-btn:hover {
    color: var(--text);
  }

  .mode-select {
    color-scheme: light dark;
    min-width: 0;
  }

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
    border: solid 1px var(--border);
    padding: 5px;
  }

  .filter-controls input {
    width: 90%;
  }

  .hidden-label {
    color: var(--text-muted);
    font-style: italic;
  }

  .click-affordance:hover {
    cursor: pointer;
    background-color: var(--bg-sidebar-hover);
  }

  .list-label {
    text-decoration: underline;
  }
</style>
