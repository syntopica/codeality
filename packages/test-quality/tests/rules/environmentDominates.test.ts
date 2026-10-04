import { describe, expect, it } from 'vitest'

import { environmentDominates } from '@/rules/environmentDominates.js'

describe('environmentDominates', () => {
  it('flags a run where environments outweigh the tests', () => {
    expect(
      environmentDominates({
        seconds: 100,
        phases: { environment: 65, tests: 5 },
      }),
    ).toEqual([expect.objectContaining({ rule: 'environment-dominates' })])
  })
  // False positives: a suite whose tests are the real cost, and a light
  // environment share.
  it('passes when tests are the cost or environments are cheap', () => {
    expect(
      environmentDominates({
        seconds: 1,
        phases: { environment: 45, tests: 50 },
      }),
    ).toEqual([])
    expect(
      environmentDominates({
        seconds: 1,
        phases: { environment: 30, tests: 5 },
      }),
    ).toEqual([])
    expect(environmentDominates(null)).toEqual([])
  })
})
