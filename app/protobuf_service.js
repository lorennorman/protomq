import { Message } from 'google-protobuf'
import { chain, filter, find, forEach, groupBy, includes, isEmpty, isString, map, omitBy, pick, reject, sortBy, without } from 'lodash-es'
import { ref, computed } from 'vue'

// make sure we have the global protobufjs object
if(!window.protobuf) {
  throw new Error("protobufjs library not loaded")
}

const
  DEBUG = true,
  debug = (...args) => DEBUG && console.log(...args),
  debugNodeType = node => (
      node.values ? 'enum'
    : node.fields ? 'message'
    : node.nested ? 'namespace'
    : 'unknown'
  )

  // extract primitive types
const PRIMITIVE_TYPES = Object.keys(protobuf.types.basic)

const
  protobufTypes = ref([]),
  messages = ref([]),
  enums = ref([])

const extractTypes = root => {
  traverseNested(root.toJSON())
  sanitizeMessageFields()
  debug("Protobuf Types:", JSON.stringify(protobufTypes.value, null, 2))
}

const traverseNested = (node, path='') => {
  debug(`Processing:`, path || 'root', debugNodeType(node))
  if(node.options?.deprecated) {
    debug('DEPRECATED')
    return
  }

  const name = path.split(['.']).at(-1)

  // process Message type
  if(node.fields) {
    protobufTypes.value.push({
      name,
      type: path,
      fieldType: 'message',
      ...pick(node, ['fields', 'oneofs'])
    })
  }

  if(node.values) {
    protobufTypes.value.push({
      name,
      type: path,
      fieldType: 'enum',
      ...node
    })
  }

  node.nested && forEach(node.nested, (items, pathSegment) => (
    traverseNested(items, isEmpty(path) ? pathSegment : `${path}.${pathSegment}`)
  ))
}

const sanitizeMessageFields = () => {
  chain(protobufTypes.value)
    .filter({ fieldType: 'message' })
    .forEach(message => {
      message.fields = chain(message.fields)
        // convert fields into array
        .map((field, fieldName) => ({
          fieldName, fieldType: detectFieldType(field), ...field
        }))
        // drop deprecated fields
        .reject(option => {
          if(option.options?.deprecated) {
            debug(`- rejecting deprecated option: ${option.fieldName}`)
            return true
          }
        })
        // drop fields where the type lookup failed
        .reject(option => {
          if(option.fieldType === 'unknown') {
            debug(`- rejecting unknown option: ${option.fieldName}`)
            return true
          }
        })
      .value()

      // iterate oneofs
      forEach(message.oneofs, ({ oneof }, fieldName) => {
        // hoist an entry into outer fields
        message.fields.push({
          fieldName,
          fieldType: 'oneof',
          type: 'oneof',
          // each listed field becomes an outer field
          options: chain(oneof)
            .map(fieldName => find(message.fields, { fieldName }))
            .compact()
          .value()
        })

        // delete the outer fields that became oneof options
        message.fields = reject(message.fields, field => includes(oneof, field.fieldName))

      })
      // delete oneofs
      delete message.oneofs
    }).value()
}

const detectFieldType = ({ type, name }) => {
  if(isPrimitive({ type })) {
    return 'primitive'
  } else if(type === 'oneof') {
    return 'oneof'
  } else {
    return findProtoFor({ type, name })?.fieldType || 'unknown'
  }
}

export const
  loadProtoFile = async filePath => {
    debug(`Loading .proto file:`, filePath)
    extractTypes(await protobuf.load(filePath))
  },

  allProtos = computed(() => {
    return sortBy(protobufTypes.value, "name")
  }),

  protosByModule = computed(() => {
    return chain(allProtos.value)
      .filter({ fieldType: 'message' })
      .groupBy(({ type }) => type.split('.').slice(1, -1).join('.'))
    .value()
  }),

  findProtoBy = findCriteria => {
    return find(protobufTypes.value, findCriteria)
  },

  findProtoFor = typeToFind => {
    return findProtoBy({ type: typeToFind.type })
      || findProtoBy({ name: typeToFind.type.split('.').at(-1) })
  },

  isPrimitive = typeToCheck => includes(PRIMITIVE_TYPES, typeToCheck.type),

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
      if(isPrimitive(field)) {
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
      oneofField.oneof = filter(oneofField.oneof, oneof => isPrimitive(oneof) || findProtoFor(oneof))
    })

    return {
      oneofs: oneofFields,
      messages: messageFields,
      enums: enumFields,
      primitives: primitiveFields
    }
  }
