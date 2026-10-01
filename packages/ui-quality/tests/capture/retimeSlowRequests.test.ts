import type { Page } from 'playwright'
import { describe, expect, it, vi } from 'vitest'

import { retimeSlowRequests } from '@/capture/retimeSlowRequests.js'

const pageAnswering = (get: (url: string) => Promise<unknown>) => {
  const request = { get: vi.fn(get) }
  const page = {
    url: () => 'http://localhost:3100/app?view=bank',
    request,
  } as unknown as Page
  return { page, request }
}

describe('retimeSlowRequests', () => {
  it('times a slow GET again on the page origin and keeps fast ones untouched', async () => {
    const { page, request } = pageAnswering(async () => Promise.resolve({}))
    const timings = await retimeSlowRequests(
      page,
      [
        {
          method: 'GET',
          path: '/api/slow?a=1',
          action: null,
          durationMs: 3000,
        },
        { method: 'GET', path: '/api/fast', action: null, durationMs: 40 },
      ],
      1000,
    )
    expect(request.get).toHaveBeenCalledTimes(1)
    expect(request.get.mock.calls[0]?.[0]).toBe(
      'http://localhost:3100/api/slow?a=1',
    )
    expect(timings[0]?.retimedMs).toBeTypeOf('number')
    expect(timings[1]).not.toHaveProperty('retimedMs')
  })

  it('never repeats a request that could write', async () => {
    const { page, request } = pageAnswering(async () => Promise.resolve({}))
    const timings = await retimeSlowRequests(
      page,
      [{ method: 'POST', path: '/app', action: 'abc', durationMs: 3000 }],
      1000,
    )
    expect(request.get).not.toHaveBeenCalled()
    expect(timings[0]).not.toHaveProperty('retimedMs')
  })

  it('keeps the first timing alone when the repeat fails', async () => {
    const { page } = pageAnswering(async () =>
      Promise.reject(new Error('timeout')),
    )
    const timings = await retimeSlowRequests(
      page,
      [{ method: 'GET', path: '/api/slow', action: null, durationMs: 3000 }],
      1000,
    )
    expect(timings[0]).not.toHaveProperty('retimedMs')
  })
})
