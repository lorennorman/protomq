import { compact, set } from 'lodash-es'
import { ref } from "vue"
import { defineStore } from "pinia"
import { useUIStore } from './ui'
import { findProtoFor } from '../protobuf_service'

export const useMessageStore = defineStore('message', () => {
  return {
    messageObject: ref(null),
    messageType: ref(null),
    newMessage: function(messageType) {
      this.messageType = messageType
      this.messageObject = {}

      initializeDefaults(this.messageObject, this.messageType)

      // update the UI to edit this message
      useUIStore().setMode('configureMessage')
    }
  }
})

const initializeDefaults = (target, type, pathPrefix=null) => {
  // default all fields
  const { fields, fieldPath } = type

  fields.forEach(field => {
    const path = compact([pathPrefix, fieldPath, field.fieldName]).join('.')

    // nested message, look up the protobuf type and recurse
    if(field.fieldType === 'message') {
      const protobuf = findProtoFor(field)
      initializeDefaults(target, protobuf, path)
      return
    }

    const defaultValue = defaultValueForField(field)

    if(defaultValue) {
      set(target, path, defaultValue)
    }
  })
}

const DEFAULTS_BY_TYPE = {
  string: 'string',
  enum: 1,
  int32: '0',
  uint32: '0',
  float: '0.0'
}

const defaultValueForField = ({ type, fieldType }) => {
  return DEFAULTS_BY_TYPE[type] || DEFAULTS_BY_TYPE[fieldType]
}
