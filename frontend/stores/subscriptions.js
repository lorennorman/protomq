import { includes, map, reject, some, without } from 'lodash-es'
import { ref, computed, watch } from "vue"
import { defineStore } from "pinia"
import { get, set } from 'idb-keyval'

// Topic patterns per subscription mode
export const SUBSCRIPTION_MODES = {
  both:   { label: 'Both V1+V2', topics: ['+/ws-b2d/+', '+/ws-d2b/+', '+/wprsnpr/#'] },
  v2:     { label: 'V2 Only',    topics: ['+/ws-b2d/+', '+/ws-d2b/+'] },
  v1:     { label: 'V1 Only',    topics: ['+/wprsnpr/#'] },
}
const SYSTEM_TOPICS = ['$SYS/#', 'state/clients']

export const useSubscriptionStore = defineStore('subscriptions', () => {
  const
    liveSubscriptions = ref([]),
    recentSubscriptions = ref([]),
    filters = ref(["#", "$SYS/*", "state/clients"]),
    disabledFilters = ref([]),
    subscriptionMode = ref('both'),
    activeFilters = computed(() => without(filters.value, ...disabledFilters.value)),
    filteredSubscriptions = computed(() => reject(recentSubscriptions.value, sub =>
      topicIsFiltered(sub)
    )),
    rejectedSubscriptions = computed(() => without(recentSubscriptions.value, ...filteredSubscriptions.value)),
    subscriptionsWithStatus = computed(() => map(filteredSubscriptions.value, sub => {
      const ours = includes(activeTopics.value, sub)
      const brokerLive = includes(liveSubscriptions.value, sub)
      return {
        topic: sub,
        status: ours ? 'live' : brokerLive ? 'other' : 'recent'
      }
    }))

  function setLiveSubscriptions(newSubs) {
    this.liveSubscriptions = newSubs
    newSubs.forEach(sub => {
      if(!includes(this.recentSubscriptions, sub)) {
        this.recentSubscriptions.push(sub)
      }
    })
    saveData()
  }

  function clearRecentSubscriptions() {
    this.recentSubscriptions = [...this.liveSubscriptions]
    saveData()
  }

  function onBrokerConnect() {
    // New server session — clear stale recents, they'll rebuild from state/clients
    this.recentSubscriptions = []
  }

  // Computed list of topics the MQTT client should subscribe to
  const activeTopics = computed(() => [
    ...SUBSCRIPTION_MODES[subscriptionMode.value].topics,
    ...SYSTEM_TOPICS
  ])

  function setSubscriptionMode(mode) {
    if (!SUBSCRIPTION_MODES[mode]) return
    subscriptionMode.value = mode
    saveData()
  }

  function toggleFilter(filterToToggle) {
    includes(this.disabledFilters, filterToToggle)
      ? this.disabledFilters = without(this.disabledFilters, filterToToggle)
      : this.disabledFilters.push(filterToToggle)
    saveData()
  }

  function addFilter(newFilter) {
    if(!includes(this.filters, newFilter)) {
      this.filters.push(newFilter)
    }
    saveData()
  }

  function topicIsFiltered(topic) {
    return some(activeFilters.value, filter =>
      // check trailing wildcards
      (filter.endsWith('*') && topic.startsWith(filter.slice(0, -1)))
      // check leading wildcards
      || (filter.startsWith('*') && topic.endsWith(filter.slice(1)))
      // check exact match
      || (filter === topic)
    )
  }

  async function loadSavedData() {
    let data
    try {
      data = JSON.parse(await get('subscriptions'))
    } catch(jsonError) {
      console.warn("Error parsing JSON from IndexedDB: ignore this on first run.")
      console.warn(jsonError)
      return
    }

    this.recentSubscriptions = data.recentSubscriptions
    this.filters = data.filters
    this.disabledFilters = data.disabledFilters || []
    if (data.subscriptionMode && SUBSCRIPTION_MODES[data.subscriptionMode]) {
      this.subscriptionMode = data.subscriptionMode
    }
  }

  function saveData() {
    set('subscriptions', JSON.stringify({
      recentSubscriptions: recentSubscriptions.value,
      filters: filters.value,
      disabledFilters: disabledFilters.value,
      subscriptionMode: subscriptionMode.value
    }))
  }

  return {
    liveSubscriptions,
    recentSubscriptions,
    filteredSubscriptions,
    rejectedSubscriptions,
    subscriptionsWithStatus,
    setLiveSubscriptions,
    filters,
    disabledFilters,
    activeFilters,
    addFilter,
    toggleFilter,
    topicIsFiltered,
    loadSavedData,
    subscriptionMode,
    activeTopics,
    setSubscriptionMode,
    clearRecentSubscriptions,
    onBrokerConnect
  }
})
