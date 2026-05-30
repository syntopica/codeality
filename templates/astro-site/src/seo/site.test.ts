import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('site.canonicalUrl derives from PUBLIC_SITE_URL', async () => {
  vi.stubEnv('PUBLIC_SITE_URL', 'https://example.com')
  const { site } = await import('./site')
  expect(site.canonicalUrl).toBe('https://example.com')
})
