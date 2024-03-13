import { compact, get, set } from 'lodash-es'
import { computed } from 'vue'
import { useMessageStore } from '../../stores/message'

/* props in, v-model out */
export const useFieldPath = props => {
  const
    { fieldPath, field: { fieldName } } = props,
    nextFieldPath = compact([fieldPath, fieldName]).join('.'),
    messageStore = useMessageStore(),
    vModel = computed({
      get: () => get(messageStore.messageObject, nextFieldPath),
      set: newValue => set(messageStore.messageObject, nextFieldPath, newValue)
    })

  return { vModel, nextFieldPath }
}
