import { find, forEach, includes, isEmpty, map, pick, reject, sortBy } from 'lodash-es'
import _ from 'lodash-es'
import { ref, computed } from 'vue'

// make sure we have the global protobufjs object
if(!window.protobuf) {
  throw new Error("protobufjs library not loaded")
}

const
  DEBUG = false,
  debug = (...args) => DEBUG && console.log(...args),
  debugNodeType = node => (
      node.values ? 'enum'
    : node.fields ? 'message'
    : node.nested ? 'namespace'
    : 'unknown'
  )

const
  ENVELOPE_MESSAGE_NAMES = ["BrokerToDevice", "DeviceToBroker"],
  // extract primitive types
  PRIMITIVE_TYPES = Object.keys(protobuf.types.basic),
  // state
  protobufRoot = ref(null),
  protobufTypes = ref([])

const extractTypes = () => {
  traverseNested(protobufRoot.value.toJSON())
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
    debug('- message:', protobufTypes.value.at(-1))
  }

  if(node.values) {
    protobufTypes.value.push({
      name,
      type: path,
      fieldType: 'enum',
      ...node
    })
    debug('- enum:', protobufTypes.value.at(-1))
  }

  node.nested && forEach(node.nested, (items, pathSegment) => (
    traverseNested(items, isEmpty(path) ? pathSegment : `${path}.${pathSegment}`)
  ))
}

const sanitizeMessageFields = () => {
  _.chain(protobufTypes.value)
    .filter({ fieldType: 'message' })
    .forEach(message => {
      message.fields = _.chain(message.fields)
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
        .sortBy(({ fieldType }) => ['enum', 'primitive', 'message', 'oneof'].indexOf(fieldType))
      .value()

      // iterate oneofs
      forEach(message.oneofs, ({ oneof }, fieldName) => {
        // hoist an entry into outer fields
        message.fields.push({
          fieldName,
          fieldType: 'oneof',
          type: 'oneof',
          // each listed field becomes an outer field
          options: _.chain(oneof)
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
    protobufRoot.value = await protobuf.load(filePath)
    extractTypes()
  },

  allProtos = computed(() => {
    return sortBy(protobufTypes.value, "name")
  }),

  protosByModule = computed(() => {
    return _.chain(allProtos.value)
      .filter({ fieldType: 'message' })
      .groupBy(({ type }) => type.split('.').slice(1, -1).join('.'))
    .value()
  }),

  findProtoBy = findCriteria => {
    return find(protobufTypes.value, findCriteria)
  },

  findProtoFor = typeToFind => {
    debug('searching protos for', typeToFind)
    return findProtoBy({ type: typeToFind.type })
      || findProtoBy({ name: typeToFind.type.split('.').at(-1) })
  },

  isPrimitive = typeToCheck => includes(PRIMITIVE_TYPES, typeToCheck.type),

  envelopeLookup = (name, object) => {
    if(includes(ENVELOPE_MESSAGE_NAMES, name)) {
      return {
        envelopeMessage: protobufRoot.value.lookup(name),
        payload: object
      }
    }

    for(let envelopeName of ENVELOPE_MESSAGE_NAMES) {
      const
        EnvelopeMessage = protobufRoot.value.lookup(envelopeName),
        payloadFields = map(EnvelopeMessage.oneofs['payload'].fieldsArray, f => ({
          name: f.name,
          type: f.type.split('.').at(-1)
        })),
        foundField = find(payloadFields, { type: name })

      if(foundField) {
        return {
          envelopeMessage: EnvelopeMessage,
          payload: { [foundField.name]: object }
        }
      }
    }

    console.warn("No envelope message found for:", name, object)
    return {}
  },

  encodeByName = (name, object) => {
    const { envelopeMessage, payload } = envelopeLookup(name, object)

    if(!envelopeMessage) {
      console.error(`Protobuf lookup failed for ${name}`)
      return
    }

    return envelopeMessage.encode(payload).finish()
  },

  decodeByName = (name, binaryMessage) => {
    const message = protobufRoot.value.lookup(name)

    if(!message) {
      console.error(`Protobuf lookup failed for ${name}`)
      return
    }

    return message.decode(binaryMessage)
  }
