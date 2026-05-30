import type { RouteRecordRaw } from 'vue-router'

import TheCounter from '@/components/TheCounter.vue'

export const routes: readonly RouteRecordRaw[] = [
  { path: '/', name: 'home', component: TheCounter },
]
