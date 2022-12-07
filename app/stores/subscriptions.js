import { includes, map, reject, some, without } from 'lodash-es'
import { ref, computed } from "vue"
import { defineStore } from "pinia"
import { get, set } from 'idb-keyval'

export const useSubscriptionStore = defineStore('subscriptions', () => {
  const
    liveSubscriptions = ref([]),
    recentSubscriptions = ref([]),
    filters = ref(["#", "$SYS/*", "state/clients"]),
    disabledFilters = ref([]),
    activeFilters = computed(() => without(filters.value, ...disabledFilters.value)),
    filteredSubscriptions = computed(() => reject(recentSubscriptions.value, sub =>
      topicIsFiltered(sub)
    )),
    rejectedSubscriptions = computed(() => without(recentSubscriptions.value, ...filteredSubscriptions.value)),
    subscriptionsWithStatus = computed(() => map(filteredSubscriptions.value, sub => {
      return {
        topic: sub,
        status: includes(liveSubscriptions.value, sub) ? 'live' : 'recent'
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

  function toggleFilter(filterToToggle) {
    includes(this.disabledFilters, filterToToggle)
      ? this.disabledFilters = without(this.disabledFilters, filterToToggle)
      : this.disabledFilters.push(filterToToggle)
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
    try {
      const data = JSON.parse(await get('subscriptions'))
      this.recentSubscriptions = data.recentSubscriptions
      this.filters = data.filters
    } catch(jsonError) {
      console.error(jsonError)
    }
  }

  function saveData() {
    set('subscriptions', JSON.stringify({ recentSubscriptions: recentSubscriptions.value, filters: filters.value }))
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
    loadSavedData
  }
})
