import { compact, get, set } from 'lodash-es'
import { computed } from 'vue'
import { useMessageStore } from '../../stores/message'

/* props in, v-model out */
export const useFieldPath = props => {
  const
    { fieldPath, field: { fieldName, type, fieldType } } = props,
    nextFieldPath = compact([fieldPath, fieldName]).join('.'),
    messageStore = useMessageStore(),
    vModel = computed({
      get: () => get(messageStore.messageObject, nextFieldPath) || defaultValueForType(type) || defaultValueForType(fieldType),
      set: newValue => set(messageStore.messageObject, nextFieldPath, newValue)
    })

  return { vModel, nextFieldPath }
}

const defaultValueForType = type => {
  switch(type) {
    case "enum":
      return 1
    case "int32":
    case "uint32":
      return "0"
    case "float":
      return "0.0"
  }
}
