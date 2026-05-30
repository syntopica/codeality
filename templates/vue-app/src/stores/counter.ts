import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  const increment = (): void => {
    count.value += 1
  }

  return { count, increment }
})
