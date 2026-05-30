import { createRouter, createWebHistory } from 'vue-router'

import TheCounter from '@/components/TheCounter.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'home', component: TheCounter }],
})
