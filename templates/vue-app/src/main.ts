import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@/App.vue'
import '@/env'
import { router } from '@/router'
import '@/styles.css'

const root = document.querySelector('#app')
if (!root) {
  throw new Error('Root element "#app" not found')
}

createApp(App).use(createPinia()).use(router).mount(root)
