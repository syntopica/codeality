import { publicRuntimeConfigSchema } from '~/publicRuntimeConfigSchema'

// Fail-fast runtime-config validation. Runs once on the client and (via the
// matching nitro context) on the server during SSR, so a missing or malformed
// NUXT_PUBLIC_* value surfaces immediately instead of as a downstream error.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  publicRuntimeConfigSchema.parse(config.public)
})
