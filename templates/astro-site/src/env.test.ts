import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('reads a valid PUBLIC_SITE_URL from the environment', async () => {
  vi.stubEnv('PUBLIC_SITE_URL', 'https://my.app')
  const { env } = await import('./env')
  expect(env.PUBLIC_SITE_URL).toBe('https://my.app')
})

it('throws when PUBLIC_SITE_URL is set to an invalid URL', async () => {
  vi.stubEnv('PUBLIC_SITE_URL', 'not-a-url')
  await expect(import('./env')).rejects.toThrow()
})

it('falls back to the build-safe default when PUBLIC_SITE_URL is absent', async () => {
  vi.stubEnv('PUBLIC_SITE_URL', undefined)
  const { env } = await import('./env')
  expect(env.PUBLIC_SITE_URL).toBe('https://example.com')
})
