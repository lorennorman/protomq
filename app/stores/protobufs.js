import { flatMap, map, sortBy, uniq } from 'lodash-es'
import { ref, computed } from "vue"
import { defineStore } from "pinia"

export const useProtobufStore = defineStore('protobufs', () => {
  const
    protobufs = ref([]),
    currentProtobuf = ref(null),
    currentProtobufFields = computed(() => []),
    protobufModules = computed(() => sortBy(uniq(map(protobufs.value, "filename"))))

  function setCurrentProtobuf(protobuf) {
    console.log('set:', protobuf)
    this.currentProtobuf = protobuf
  }

  async function loadProtoFile(filepath) {
    const
      root = await protobuf.load(filepath),
      modules = root.nested.wippersnapper.nested,
      messages = flatMap(
        map(modules, "nested.v1.nested"),
        Object.values
      )

    this.protobufs = sortBy(messages, "name")
  }

  return { protobufs, protobufModules, currentProtobuf, currentProtobufFields, loadProtoFile, setCurrentProtobuf }
})

document.addEventListener("DOMContentLoaded", async () => {
  await useProtobufStore().loadProtoFile('/protobufs/signal.proto')
})
