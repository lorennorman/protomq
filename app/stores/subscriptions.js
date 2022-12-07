import { includes, reject, some, without } from 'lodash-es'
import { ref, computed } from "vue"
import { defineStore } from "pinia"

export const useSubscriptionStore = defineStore('subscriptions', () => {
  const
    liveSubscriptions = ref([]),
    filters = ref(["#", "$SYS/*"]),
    disabledFilters = ref(["#"]),
    activeFilters = computed(() => without(filters.value, ...disabledFilters.value)),
    setLiveSubscriptions = function(newSubs) {
      this.liveSubscriptions = newSubs
    },
    filteredSubscriptions = computed(() => reject(liveSubscriptions.value, sub =>
      some(activeFilters.value, filter =>
        (filter.endsWith('*') && sub.startsWith(filter.slice(0, -1)))
          || (filter === sub)
      )
    )),
    rejectedSubscriptions = computed(() => without(liveSubscriptions.value, ...filteredSubscriptions.value)),
    toggleFilter = function(filterToToggle) {
      includes(this.disabledFilters, filterToToggle)
        ? this.disabledFilters = without(this.disabledFilters, filterToToggle)
        : this.disabledFilters.push(filterToToggle)
    },
    addFilter = function(newFilter) {
      if(!includes(this.filters, newFilter)) {
        this.filters.push(newFilter)
      }
    }

  return {
    liveSubscriptions,
    filteredSubscriptions,
    rejectedSubscriptions,
    setLiveSubscriptions,
    filters,
    disabledFilters,
    activeFilters,
    addFilter,
    toggleFilter
  }
})
