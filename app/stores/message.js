import { compact, set } from 'lodash-es'
import { ref } from "vue"
import { defineStore } from "pinia"
import { useUIStore } from './ui'

export const useMessageStore = defineStore('message', () => {
  return {
    messageObject: ref(null),
    messageType: ref(null),
    newMessage: function(messageType) {
      this.messageType = messageType
      this.messageObject = {}

      // default all fields
      const { fields, fieldPath } = messageType

      fields.forEach(field => {
        const
          path = compact([fieldPath, field.fieldName]).join('.'),
          defaultValue = defaultValueForType(field.type) || defaultValueForType(field.fieldType)

        if(defaultValue) {
          set(this.messageObject, path, defaultValue)
        }
      })

      // update the UI to edit this message
      useUIStore().setMode('configureMessage')
    }
  }
})

const defaultValueForType = type => {
  switch(type) {
    case "string":
      return "string"
    case "enum":
      return 1
    case "int32":
    case "uint32":
      return "0"
    case "float":
      return "0.0"
  }
}
