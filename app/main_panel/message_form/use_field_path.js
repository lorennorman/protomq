import { compact } from 'lodash-es'
import { computed } from 'vue'
import { useMessageStore } from '../../stores/message'

/* props in, v-model out */
export const useFieldPath = props => {
  const
    { fieldPath, field: { fieldName } } = props,
    nextFieldPath = compact([fieldPath, fieldName]).join('.'),
    { getDeep, setDeep } = useMessageStore(),
    vModel = computed({
      get: () => getDeep(nextFieldPath),
      set: newValue => setDeep(nextFieldPath, newValue)
    })

  return { vModel, nextFieldPath }
}
