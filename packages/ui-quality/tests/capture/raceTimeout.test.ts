import { describe, expect, it } from 'vitest'

import { raceTimeout } from '@/capture/raceTimeout.js'

describe('raceTimeout', () => {
  it('returns the value when it arrives in time', async () => {
    await expect(raceTimeout(Promise.resolve(1), 1000, () => 0)).resolves.toBe(
      1,
    )
  })
  it('returns the fallback when the promise never settles', async () => {
    const never = new Promise<number>(() => undefined)
    await expect(raceTimeout(never, 10, () => 0)).resolves.toBe(0)
  })
})
