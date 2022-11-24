import { flatMap, map, sortBy, uniq } from 'lodash-es'
import { ref, computed } from "vue"
import { defineStore } from "pinia"

export const useProtobufStore = defineStore('protobufs', () => {
  const
    protobufs = ref([]),
    currentProtobuf = ref(null),
    currentProtobufFields = computed(() => []),
    protobufModules = computed(() => uniq(map(protobufs.value, "filename")))

  function setCurrentProtobuf(protobuf) {
    console.log('set:', protobuf)
    this.currentProtobuf = protobuf
  }

  return { protobufs, protobufModules, currentProtobuf, currentProtobufFields, setCurrentProtobuf }
})

document.addEventListener("DOMContentLoaded", async () => {
  const
    root = await protobuf.load('/protobufs/signal.proto'),
    modules = root.nested.wippersnapper.nested,
    messages = flatMap(
      map(modules, "nested.v1.nested"),
      Object.values
    )

  useProtobufStore().protobufs = sortBy(messages, ["filename", "name"])
})
