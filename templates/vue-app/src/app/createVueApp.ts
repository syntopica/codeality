import { createPinia } from 'pinia'
import type { App } from 'vue'
import { createApp } from 'vue'

import RootComponent from '@/App.vue'
import { router } from '@/router'

export function createVueApp(): App {
  return createApp(RootComponent).use(createPinia()).use(router)
}
