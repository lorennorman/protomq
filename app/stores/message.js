import { filter, flatMap, includes, map, reject } from 'lodash-es'
import { ref, computed } from "vue"
import { defineStore } from "pinia"
import { useUIStore } from './ui'

const PRIMITIVE_TYPES = [
  "int32", "uint32", "float", "string", "bool"
]
export const useMessageStore = defineStore('message', () => {
  const
    message = ref(null),
    fields = computed(() => Object.values(message.value.fields)),
    oneofs = computed(() => message.value.oneofs),
    primitives = computed(() => (
      filter(fields.value, field => includes(PRIMITIVE_TYPES, field.type))
    )),
    rejectPrimitivesAndOneofs = fields => {
      const oneofNames = map(flatMap(oneofs.value, "fieldsArray"), "name")
      return reject(fields, field => (
        includes(PRIMITIVE_TYPES, field.type) || includes(oneofNames, field.name)
      ))
    },
    enums = computed(() => reject(rejectPrimitivesAndOneofs(fields.value), field => field.fields)),
    messages = computed(() => reject(rejectPrimitivesAndOneofs(fields.value), field => !field.fields))

  return {
    message,
    oneofs,
    messages,
    enums,
    primitives,
    newMessage: function(protobuf) {
      console.log(protobuf)
      this.message = protobuf
      useUIStore().setMode('configureMessage')
    }
  }
})
