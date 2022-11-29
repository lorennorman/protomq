import { filter, find, forEach, groupBy, includes, isString, map, omitBy, reject, sortBy, without } from 'lodash-es'
import { ref, computed } from 'vue'

// make sure we have the global protobufjs object
if(!window.protobuf) {
  throw new Error("protobufjs library not loaded")
}

// extract primitive types
const PRIMITIVE_TYPES = Object.keys(protobuf.types.basic)

const
  messages = ref([]),
  enums = ref([])

const extractTypes = root => {
  traverseNested(root.toJSON())
}

const traverseNested = (node, path='') => {
  if(node.options?.deprecated) { return }

  const name = path.split(['.']).at(-1)

  // process Message type
  if(node.fields) {
    messages.value.push({
      name, path,
      message: {
        ...node,
        // reject deprecated options
        fields: omitBy(node.fields, "options.deprecated")
      }
    })
  }

  if(node.values) {
    enums.value.push({
      name, path, enum: node
    })
  }

  node.nested && forEach(node.nested, (items, pathSegment) => (
    traverseNested(items, `${path}.${pathSegment}`)
  ))
}

export const
  loadProtoFile = async filePath => {
    extractTypes(await protobuf.load(filePath))
  },

  allProtos = computed(() => {
    return sortBy(messages.value, "name")
  }),

  findProtoBy = findCriteria => {
    return find(messages.value, findCriteria)
  },

  findProtoFor = typeToFind => {
    console.log('searching for:', typeToFind)
    return findProtoBy({ type: typeToFind.type })
      || findProtoBy({ name: typeToFind.type.split('.').at(-1) })
  },

  protosByModule = computed(() => {
    return groupBy(allProtos.value, ({ path }) => path.split('.').slice(2, -1).join('.'))
  }),

  fields = protobufType => {
    // auto-lookup things passed with a "type" property
    const { message } = protobufType.type
      ? findProtoFor(protobufType) || {}
      : protobufType

    if(!message) {
      console.error(`Failed lookup for protobuf type: ${protobufType.type}`)
      return { oneofs: [], messages: [], enums: [], primitives: [] }
    }

    const
      namedFields = map(message.fields, (field, fieldName) => ({ ...field, fieldName })),
      oneofFields = map(message.oneofs, ({ oneof }, fieldName) => ({ fieldName, type: 'oneof', oneof: [ ...oneof ] })),
      messageFields = [],
      enumFields = [],
      primitiveFields = []

    forEach(namedFields, field => {
      // detect oneofs first
      const foundOneof = find(oneofFields, ({ oneof }) => includes(oneof, field.fieldName))
      if(foundOneof) {
        foundOneof.oneof = without(foundOneof.oneof, field.fieldName)
        return foundOneof.oneof.push(field)
      }

      // detect primitive fields
      if(includes(PRIMITIVE_TYPES, field.type)) {
        return primitiveFields.push(field)
      }

      // detect enums
      const foundEnum = find(enums.value, { name: field.type })
      if(foundEnum) {
        // add enum values to the field
        return enumFields.push({ ...field, values: foundEnum.enum.values })
      }

      // default must be messages
      messageFields.push(field)
    })

    // clear the unmatched oneofs (referring to deprecated messages)
    forEach(oneofFields, oneofField => {
      oneofField.oneof = reject(oneofField.oneof, isString)
      oneofField.oneof = filter(oneofField.oneof, findProtoFor)
    })

    return {
      oneofs: oneofFields,
      messages: messageFields,
      enums: enumFields,
      primitives: primitiveFields
    }
  }
