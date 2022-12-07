import { useSubscriptionStore } from "./subscriptions"

export const loadStoreData = async () => {
  return Promise.all([
    await useSubscriptionStore().loadSavedData(),
    // other
    // things
    // to
    // persist
  ])
}
