import type { Ref } from 'vue'

export type UseCounterReturn = {
  count: Ref<number>
  increment: () => void
}
