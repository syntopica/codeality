import type { UseCounterReturn } from '~/types/UseCounterReturn'

// `useState` is Nuxt's SSR-friendly, auto-imported reactive state composable —
// the idiomatic alternative to a standalone store for shared component state.
export function useCounter(): UseCounterReturn {
  const count = useState<number>('counter', () => 0)
  const increment = (): void => {
    count.value += 1
  }
  return { count, increment }
}
