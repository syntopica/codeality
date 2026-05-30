import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import TheCounter from '@/components/TheCounter.vue'

const routes: readonly RouteRecordRaw[] = [
  { path: '/', name: 'home', component: TheCounter },
]

export const router = createRouter({
  history: createWebHistory(),
  routes: [...routes],
})
