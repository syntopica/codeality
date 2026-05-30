import tailwindcss from '@tailwindcss/vite'

// Nuxt requires a single default-export config object; this file is exempt from
// the one-export / hidden-declaration policy via eslint.config.mjs.
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-30',
  modules: ['@nuxt/eslint', '@nuxt/test-utils/module'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    // Type checking runs separately via `vue-tsc --noEmit` (the `type-check`
    // script), so the build does not pay the in-process checker cost.
    typeCheck: false,
    strict: true,
  },
  eslint: {
    config: {
      // Let our shared @busirocket flat-config layers own JS/TS/Vue linting;
      // @nuxt/eslint then contributes only Nuxt-aware rules and auto-import globals.
      standalone: false,
    },
  },
  runtimeConfig: {
    public: {
      // Validated at startup by app/plugins/validateEnv.ts (Zod, fail-fast).
      apiBaseUrl: '',
    },
  },
})
