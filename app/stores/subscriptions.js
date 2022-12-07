import { includes, map, reject, some, without } from 'lodash-es'
import { ref, computed } from "vue"
import { defineStore } from "pinia"

export const useSubscriptionStore = defineStore('subscriptions', () => {
  const
    liveSubscriptions = ref([]),
    recentSubscriptions = ref([]),
    filters = ref(["#", "$SYS/*"]),
    disabledFilters = ref([]),
    activeFilters = computed(() => without(filters.value, ...disabledFilters.value)),
    setLiveSubscriptions = function(newSubs) {
      this.liveSubscriptions = newSubs
      newSubs.forEach(sub => {
        if(!includes(this.recentSubscriptions, sub)) {
          this.recentSubscriptions.push(sub)
        }
      })
    },
    filteredSubscriptions = computed(() => reject(recentSubscriptions.value, sub =>
      some(activeFilters.value, filter =>
        (filter.endsWith('*') && sub.startsWith(filter.slice(0, -1)))
          || (filter.startsWith('*') && sub.endsWith(filter.slice(1)))
          || (filter === sub)
      )
    )),
    rejectedSubscriptions = computed(() => without(recentSubscriptions.value, ...filteredSubscriptions.value)),
    toggleFilter = function(filterToToggle) {
      includes(this.disabledFilters, filterToToggle)
        ? this.disabledFilters = without(this.disabledFilters, filterToToggle)
        : this.disabledFilters.push(filterToToggle)
    },
    addFilter = function(newFilter) {
      if(!includes(this.filters, newFilter)) {
        this.filters.push(newFilter)
      }
    },
    subscriptionsWithStatus = computed(() => map(filteredSubscriptions.value, sub => {
      return {
        topic: sub,
        status: includes(liveSubscriptions.value, sub) ? 'live' : 'recent'
      }
    }))

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
    toggleFilter
  }
})
