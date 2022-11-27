import { filter, flatMap, groupBy, includes, map, reduce, reject, sortBy } from 'lodash-es'
import { ref, computed } from 'vue'

// make sure we have the global protobufjs object
if(!window.protobuf) {
  throw new Error("protobufjs library not loaded")
}

// track whether we've loaded proto files
const protobufRoot = ref(null)
// extract primitive types
const PRIMITIVE_TYPES = Object.keys(protobuf.types.basic)

export const
  loadProtoFile = async filePath => {
    protobufRoot.value = await protobuf.load(filePath)
  },

  allProtos = computed(() => {
    if(!protobufRoot.value) { return [] }

    const
      // dig out the leaf nodes of the wippersnapper protos
      modules = protobufRoot.value.nested.wippersnapper.nested,
      messages = flatMap(
        map(modules, "nested.v1.nested"),
        Object.values
      ),
      // reject deprecated messages and enums
      liveMessages = reject(reject(messages, "options.deprecated"), "values"),
      sortedMessages = sortBy(liveMessages, "name")

    return sortedMessages
  }),

  protosByModule = computed(() => groupBy(allProtos.value, "filename")),

  fields = messageToQuery => {
    // look at its fields
    const
      fields = Object.values(messageToQuery.fields),
      // pull out all primitives
      primitives = filter(fields, ({ type }) => includes(PRIMITIVE_TYPES, type)),
      // pull out oneofs
      { oneofs } = messageToQuery,
      { messages, enums } = reduce(fields, ({ messages, enums }, field) => {
        const oneofNames = map(flatMap(oneofs, "fieldsArray"), "name")
        if(includes(oneofNames, field.name) || includes(PRIMITIVE_TYPES, field.type)) {
          return { messages, enums }
        }

        const typeOrEnum = protobufRoot.value.lookup(field.type)
        typeOrEnum.fieldName = field.name

        return typeOrEnum.values
          ? { messages, enums: enums.concat(typeOrEnum) }
          : { messages: messages.concat(typeOrEnum), enums }
      }, { messages: [], enums: [] })

    // lookup the remainder and sort enums and messages
    return { oneofs, messages, enums, primitives }
  }
