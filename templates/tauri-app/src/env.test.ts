import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('parses a valid VITE_API_BASE_URL', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
  const { env } = await import('./env')
  expect(env.VITE_API_BASE_URL).toBe('https://api.example.com')
})

it('throws when VITE_API_BASE_URL is not a valid URL', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'not-a-url')
  await expect(import('./env')).rejects.toThrow()
})
