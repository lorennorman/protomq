import { cloneDeep, compact, find, get, includes, set, some } from 'lodash-es'
import { ref } from "vue"
import { defineStore, acceptHMRUpdate } from 'pinia'
import { useUIStore } from './ui'
import { findProtoFor } from '../protobuf_service'

// detect and scrub array syntax
const scrubBrackets = pathSegment => {
  const bracketPosition = pathSegment.indexOf('[')

  return (bracketPosition > -1)
    ? pathSegment.slice(0, bracketPosition)
    : pathSegment
}

export const useMessageStore = defineStore('message', () => {
  return {
    messageObject: ref(null),
    messageType: ref(null),
    messageFields: ref(null),
    formKey: ref(0),

    // caches fields from protobufs, so we can add/remove fields without
    // modifying the core protobuf info
    getFieldsAtPath: function(path='') {
      // cache hits return immediately
      if(this.messageFields[path]) { return this.messageFields[path] }

      let lastPath = ''
      path.split('.').forEach(pathSegment => {
        const currentPath = compact([lastPath, pathSegment]).join('.')

        if(!this.messageFields[currentPath]) {
          // look it up and set it
          // scrub brackets only on the last segment of the path to avoid
          // truncating at an ancestor's array index (e.g. "foo[0].bar" → "foo.bar")
          const scrubLastSegment = p => {
            const lastDot = p.lastIndexOf('.')
            if(lastDot === -1) return scrubBrackets(p)
            return p.slice(0, lastDot + 1) + scrubBrackets(p.slice(lastDot + 1))
          }
          const lastPathMessageFields = this.messageFields[lastPath] || this.messageFields[scrubLastSegment(lastPath)]
          const foundField = lastPathMessageFields.find(({ fieldName, fieldType, options=[] }) => {
            if(fieldType === 'oneof') {
              return some(options, { fieldName: scrubBrackets(pathSegment) })
            } else {
              return fieldName === scrubBrackets(pathSegment)
            }
          })

          if(!foundField) {
            console.warn('field not found:', pathSegment, lastPathMessageFields)
            this.messageFields[currentPath] = []

          } else {
            const toFind = (foundField.fieldType === 'oneof')
              ? find(foundField.options, { fieldName: scrubBrackets(pathSegment) })
              : foundField
            const protobuf = findProtoFor(toFind)
            if(!protobuf) {
              throw new Error(`Protobuf not found for: ${toFind}`)
            }

            // cache a copy of the fields in the protobuf
            this.messageFields[currentPath] = cloneDeep(protobuf.fields)
          }
        }

        lastPath = currentPath
      })

      return this.messageFields[lastPath]
    },

    // call when a OneOf selection changes
    setOneOf: function(path, selection) {
      // adds a new field based on the selection
      const peerPath = path.split('.').slice(0, -1).join('.')
      const selectionPath = compact([peerPath, selection.fieldName]).join('.')
      const fields = this.getFieldsAtPath(peerPath)
      fields.push(selection)
      // sets the data payload for the new field
      this.setDeep(path, selection.fieldName)
      this.setDeep(selectionPath, selection)
    },

    clearOneOf: function(path, unselection) {
      // remove it from the type fields
      const peerPath = path.split('.').slice(0, -1).join('.')
      const fields = this.getFieldsAtPath(peerPath)
      const indexToRemove = fields.indexOf(unselection)
      fields.splice(indexToRemove, 1)

      // remove it from the payload data
      const unselectedPath = compact([peerPath, unselection.fieldName]).join('.')
      this.setDeep(unselectedPath, undefined)

      // clear the top-level setting
      this.setDeep(path, null)
    },

    newMessage: function(messageType) {
      this.messageType = messageType
      this.messageObject = {}
      this.messageFields = {
        '': cloneDeep(messageType.fields)
      }
      this.formKey++

      this.setDefaults(this.messageType)

      // update the UI to edit this message
      useUIStore().setMode('configureMessage')
    },

    clearMessage: function() {
      this.messageType = null
      this.messageObject = null
      this.messageFields = null

      useUIStore().setMode('messages')
    },

    getDeep: function(pathToGet) {
      return get(this.messageObject, pathToGet)
    },

    setDeep: function(pathToSet, valueToSet, isArray=false) {
      if(valueToSet?.fieldType) {
        // set the given path to the given fieldname
        set(this.messageObject, pathToSet, isArray ? [valueToSet.fieldName] : valueToSet.fieldName)

        if(valueToSet.fieldType === 'message') {
          // make a new path at fieldname and recurse into setDefaults
          const pathItems = pathToSet.split('.')
          pathItems[pathItems.length -1] = valueToSet.fieldName
          const nextPath = pathItems.join('.')
          const protobuf = findProtoFor(valueToSet)
          this.setDefaults(protobuf, nextPath)
        } else {
          this.setDefault(valueToSet, pathToSet)
        }

        return
      }

      set(this.messageObject, pathToSet, isArray ? [valueToSet] : valueToSet)
    },

    popDeep: function(pathToRemove) {
      this.getDeep(pathToRemove).pop()
    },

    setDefault: function(field, path) {
      const isArray = field.rule === 'repeated'

      // Skip optional message fields — they'll be added on demand via "+" button.
      // Only auto-populate repeated message fields (they get the +/- UI).
      if(field.fieldType === 'message') {
        if(!isArray) return  // skip optional sub-messages for compact view
        this.setDeep(path, field, isArray)
        return
      }

      const defaultValue = defaultValueForField(field)

      if(defaultValue || defaultValue === false) {
        this.setDeep(path, defaultValue, isArray)
      } else {
        this.setDeep(path, null, isArray)
      }
    },

    setDefaults: function(type, pathPrefix=null) {
      // default all fields
      const { fieldPath } = type
      const fields = this.getFieldsAtPath(compact([pathPrefix, fieldPath]).join('.'))

      fields.forEach(field => {
        const path = compact([pathPrefix, fieldPath, field.fieldName]).join('.')

        this.setDefault(field, path)
      })
    },

    // Load a message form pre-populated with data from an existing object (e.g., script step).
    // Phase 1: select oneofs from the data so messageFields cache is fully populated.
    // Phase 2: replace messageObject with a clean copy built from the data (no junk defaults).
    loadFromData: function(messageType, data) {
      // Initialize form structure
      this.messageType = messageType
      this.messageObject = {}
      this.messageFields = { '': cloneDeep(messageType.fields) }
      this.formKey++

      // Phase 1: walk data to select oneofs and populate messageFields cache
      this._selectOneofsFromData(data, '')

      // Phase 2: build a clean messageObject with only oneof selectors + actual data
      this.messageObject = {}
      this._buildObjectFromData(data, this.messageObject, '')

      useUIStore().setMode('configureMessage')
    },

    // Recursively walk data to find and select oneofs. This triggers setOneOf which
    // populates the messageFields cache (needed for form rendering).
    _selectOneofsFromData: function(data, path) {
      if (!data || typeof data !== 'object') return

      const fields = this.getFieldsAtPath(path)
      if (!fields) return

      for (const key of Object.keys(data)) {
        const value = data[key]

        const oneofField = fields.find(f =>
          f.fieldType === 'oneof' && f.options?.some(o => o.fieldName === key)
        )

        if (oneofField) {
          const option = oneofField.options.find(o => o.fieldName === key)
          const oneofPath = compact([path, oneofField.fieldName]).join('.')
          this.setOneOf(oneofPath, option)

          if (option.fieldType === 'message' && value && typeof value === 'object') {
            this._selectOneofsFromData(value, compact([path, key]).join('.'))
          }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Regular message field - recurse to find nested oneofs
          this._selectOneofsFromData(value, compact([path, key]).join('.'))
        }
      }
    },

    // Build a clean messageObject from the data, adding oneof selector keys as needed.
    _buildObjectFromData: function(data, target, path) {
      if (!data || typeof data !== 'object') return

      const fields = this.getFieldsAtPath(path)
      if (!fields) return

      for (const key of Object.keys(data)) {
        const value = data[key]

        // Check if this key belongs to a oneof — if so, set the selector
        const oneofField = fields.find(f =>
          f.fieldType === 'oneof' && f.options?.some(o => o.fieldName === key)
        )

        if (oneofField) {
          // Set the oneof selector (e.g., payload: "checkin")
          target[oneofField.fieldName] = key

          if (value && typeof value === 'object' && !Array.isArray(value)) {
            target[key] = {}
            this._buildObjectFromData(value, target[key], compact([path, key]).join('.'))
          } else {
            target[key] = value
          }
        } else {
          // Regular field — look up field definition for type-aware handling
          const field = fields.find(f => f.fieldName === key)

          if (field?.fieldType === 'enum' && typeof value === 'string') {
            // Convert enum string name (e.g., "R_OK") to numeric value (e.g., 1)
            const enumProto = findProtoFor(field)
            if (enumProto?.values?.[value] !== undefined) {
              target[key] = enumProto.values[value]
            } else {
              target[key] = value
            }
          } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Nested message — recurse to handle any inner enums/oneofs
            target[key] = {}
            this._buildObjectFromData(value, target[key], compact([path, key]).join('.'))
          } else {
            target[key] = value
          }
        }
      }
    }
  }
})

const DEFAULTS_BY_TYPE = {
  string: 'string',
  enum: 1,
  int32: '0',
  uint32: '0',
  float: '0.0',
  bool: false
}

const defaultValueForField = ({ type, fieldType, options }) => {
  // prefer nanopb default from .options files when present
  if(options?.default !== undefined) {
    return options.default
  }

  const recognizedTypes = Object.keys(DEFAULTS_BY_TYPE)

  return (includes(recognizedTypes, type)
    ? DEFAULTS_BY_TYPE[type]
    : DEFAULTS_BY_TYPE[fieldType])
}

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMessageStore, import.meta.hot))
}
