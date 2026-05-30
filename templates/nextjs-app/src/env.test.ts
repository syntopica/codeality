import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('parses a valid NEXT_PUBLIC_SITE_URL', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')
  const { env } = await import('./env')
  expect(env.NEXT_PUBLIC_SITE_URL).toBe('https://example.com')
})

it('throws when NEXT_PUBLIC_SITE_URL is not a valid URL', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'not-a-url')
  await expect(import('./env')).rejects.toThrow()
})

it('throws when NEXT_PUBLIC_SITE_URL is missing', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
  await expect(import('./env')).rejects.toThrow()
})
