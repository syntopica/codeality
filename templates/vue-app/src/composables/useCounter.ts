import { storeToRefs } from 'pinia'

import { useCounterStore } from '@/stores/counter'
import type { UseCounterReturn } from '@/types/UseCounterReturn'

export function useCounter(): UseCounterReturn {
  const store = useCounterStore()
  const { count } = storeToRefs(store)
  const increment = (): void => {
    store.increment()
  }
  return { count, increment }
}
