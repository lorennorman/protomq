import { isArray, map, filter} from 'lodash-es'
import { ref, computed } from "vue"
import { defineStore } from "pinia"
import PB from '/protobufs'

export const useProtobufStore = defineStore('protobufs', () => {
  const
    protobufs = ref(Object.keys(PB)),
    currentProtobuf = ref(null),
    currentProtobufFields = computed(() => {
      const pb = PB[currentProtobuf.value]
      if(!pb) { return [] }

      const proto = pb.prototype || pb
      const setMethods = map(filter(Object.keys(proto), key => key.startsWith("set")), key => key.slice(3))

      return setMethods
    })

  function setCurrentProtobuf(protobuf) {
    this.currentProtobuf = protobuf
  }

  return { protobufs, currentProtobuf, currentProtobufFields, setCurrentProtobuf }
})
