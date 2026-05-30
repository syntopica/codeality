import { afterEach, expect, it, vi } from 'vitest'

import { fetchGreeting } from './fetchGreeting'

afterEach(() => {
  vi.restoreAllMocks()
})

it('returns the validated greeting', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'hello' }),
    }),
  )
  await expect(fetchGreeting('/api/greeting')).resolves.toEqual({
    message: 'hello',
  })
})

it('throws when the payload fails validation', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: '' }),
    }),
  )
  await expect(fetchGreeting('/api/greeting')).rejects.toThrow()
})

it('throws on a non-ok response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
  await expect(fetchGreeting('/api/greeting')).rejects.toThrow()
})
