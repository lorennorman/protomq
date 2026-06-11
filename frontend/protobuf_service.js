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
  // state — protobufRoot is the V2 envelope root (used for encode/decode);
  // protobufRootV1 is the legacy root. protobufTypes is a combined, flat list
  // of every message/enum across both, each tagged with `version`.
  protobufRoot = ref(null),
  protobufRootV1 = ref(null),
  protobufTypes = ref([])

const extractTypes = (root, version) => {
  traverseNested(root.toJSON(), '', version)
}

const traverseNested = (node, path='', version) => {
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
      version,
      fieldType: 'message',
      ...pick(node, ['fields', 'oneofs'])
    })
    debug('- message:', protobufTypes.value.at(-1))
  }

  if(node.values) {
    protobufTypes.value.push({
      name,
      type: path,
      version,
      fieldType: 'enum',
      ...node
    })
    debug('- enum:', protobufTypes.value.at(-1))
  }

  node.nested && forEach(node.nested, (items, pathSegment) => (
    traverseNested(items, isEmpty(path) ? pathSegment : `${path}.${pathSegment}`, version)
  ))
}

const sanitizeMessageFields = () => {
  _.chain(protobufTypes.value)
    .filter({ fieldType: 'message' })
    .forEach(message => {
      // resolve the parent namespace from the message's fully-qualified type
      // e.g. "ws.ds18x20.B2D" -> "ws.ds18x20"
      const parentNamespace = message.type.split('.').slice(0, -1).join('.')

      message.fields = _.chain(message.fields)
        // convert fields into array, stamp with parent namespace for type resolution
        .map((field, fieldName) => ({
          fieldName, fieldType: detectFieldType(field, parentNamespace, message.type), parentNamespace, messageType: message.type, ...field
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

const detectFieldType = ({ type, name }, parentNamespace, messageType) => {
  if(isPrimitive({ type })) {
    return 'primitive'
  } else if(type === 'oneof') {
    return 'oneof'
  } else {
    return findProtoFor({ type, name, parentNamespace, messageType })?.fieldType || 'unknown'
  }
}

// V1 bundle path + the standalone description.proto. The V1 bundle is compiled
// from signal.proto, which never imports description.proto — so the checkin
// types live in that extra file and get merged into the same root.
const V1_BUNDLE_PATH = '/protobufs-v1/bundle.json'
const V1_DESCRIPTION_PATH = '/protobufs-v1/description.proto'

const groupByModule = (version) =>
  _.chain(protobufTypes.value)
    .filter({ fieldType: 'message', version })
    .sortBy('type')
    // module label: drop the leading package + trailing type name.
    // V2 "ws.display.Add" -> "display"; V1 "wippersnapper.display.v1.X" -> "display.v1"
    .groupBy(({ type }) => type.split('.').slice(1, -1).join('.'))
  .value()

export const
  loadProtoFile = async filePath => {
    debug(`Loading V2 .proto file:`, filePath)
    protobufRoot.value = await protobuf.load(filePath)
    extractTypes(protobufRoot.value, 'v2')

    // V1 is best-effort: a missing/broken V1 bundle must not break the V2 UI.
    try {
      const v1 = await protobuf.load(V1_BUNDLE_PATH)
      await v1.load(V1_DESCRIPTION_PATH)
      protobufRootV1.value = v1
      extractTypes(v1, 'v1')
    } catch (err) {
      console.warn('V1 protos failed to load (V1 sidebar will be empty):', err)
    }

    // Resolve field types across both versions once everything is present.
    sanitizeMessageFields()
    debug("Protobuf Types:", JSON.stringify(protobufTypes.value, null, 2))
  },

  allProtos = computed(() => {
    return sortBy(protobufTypes.value, "path")
  }),

  protosByModuleV2 = computed(() => groupByModule('v2')),

  protosByModuleV1 = computed(() => groupByModule('v1')),

  // Backward-compatible alias (V2 only) for any caller that still imports it.
  protosByModule = protosByModuleV2,

  findProtoBy = findCriteria => {
    return find(protobufTypes.value, findCriteria)
  },

  findProtoFor = typeToFind => {
    debug('searching protos for', typeToFind)
    // try exact fully-qualified type first
    const exactMatch = findProtoBy({ type: typeToFind.type })
    if(exactMatch) return exactMatch

    // try nested type within the containing message (proto3: inner scope shadows outer)
    // e.g. type "Response" inside message "ws.checkin.Response" -> "ws.checkin.Response.Response" (the nested enum)
    if(typeToFind.messageType) {
      const nestedType = `${typeToFind.messageType}.${typeToFind.type}`
      const nestedMatch = findProtoBy({ type: nestedType })
      if(nestedMatch) return nestedMatch
    }

    // if the field carries a parentNamespace, resolve relative type within that namespace
    // e.g. type "Add" in namespace "ws.ds18x20" -> look for "ws.ds18x20.Add"
    if(typeToFind.parentNamespace) {
      const qualifiedType = `${typeToFind.parentNamespace}.${typeToFind.type}`
      const nsMatch = findProtoBy({ type: qualifiedType })
      if(nsMatch) return nsMatch
    }

    // last resort: match by short name (first match wins — ambiguous for common names)
    return findProtoBy({ name: typeToFind.type.split('.').at(-1) })
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

  // Version-aware encode for the send form. V2 wraps the payload in its signal
  // envelope (BrokerToDevice/DeviceToBroker). V1 has no envelope — the selected
  // message type IS the wire message, so encode it directly from the V1 root.
  encodeMessage = (messageType, object) => {
    if(messageType.version === 'v1') {
      const T = protobufRootV1.value?.lookup(messageType.type)
      if(!T) {
        console.error(`V1 protobuf lookup failed for ${messageType.type}`)
        return
      }
      return T.encode(T.fromObject(object)).finish()
    }
    return encodeByName(messageType.name, object)
  },

  decodeByName = (name, binaryMessage) => {
    const message = protobufRoot.value.lookup(name)
      || protobufRootV1.value?.lookup(name)

    if(!message) {
      console.error(`Protobuf lookup failed for ${name}`)
      return
    }

    return message.decode(binaryMessage)
  }
