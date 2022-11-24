import { flatMap, map } from 'lodash-es'
import { ref, computed } from "vue"
import { defineStore } from "pinia"

export const useProtobufStore = defineStore('protobufs', () => {
  const
    protobufs = ref([]),
    currentProtobuf = ref(null),
    currentProtobufFields = computed(() => [])

  function setCurrentProtobuf(protobuf) {
    this.currentProtobuf = protobuf
  }

  return { protobufs, currentProtobuf, currentProtobufFields, setCurrentProtobuf }
})

document.addEventListener("DOMContentLoaded", async () => {
  const
    root = await protobuf.load('/protobufs/signal.proto'),
    modules = root.nested.wippersnapper.nested,
    messages = flatMap(
      map(modules, "nested.v1.nested"),
      Object.values
    )

  useProtobufStore().protobufs = messages
})
