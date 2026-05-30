import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'

import { useCounterStore } from '@/stores/counter'

export const useCounter = (): {
  count: Ref<number>
  increment: () => void
} => {
  const store = useCounterStore()
  const { count } = storeToRefs(store)
  const increment = (): void => {
    store.increment()
  }
  return { count, increment }
}
