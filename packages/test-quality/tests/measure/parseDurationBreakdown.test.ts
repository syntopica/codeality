import { describe, expect, it } from 'vitest'

import { parseDurationBreakdown } from '@/measure/parseDurationBreakdown.js'

describe('parseDurationBreakdown', () => {
  // vitest 5, verticagtm 2026-10-04, as printed.
  it('reads the shares vitest 5 prints', () => {
    expect(
      parseDurationBreakdown(
        '   Duration  72.52s (environment 31%, setup 28%, transform 16%, import 12%, tests 9%, worker 4%)\n',
      ),
    ).toEqual({
      seconds: 72.52,
      phases: {
        environment: 31,
        setup: 28,
        transform: 16,
        import: 12,
        tests: 9,
        worker: 4,
      },
    })
  })
  // vitest 4, 10xjoy 2026-10-04, as printed: summed seconds, not shares.
  it('turns the seconds vitest 4 prints into shares', () => {
    expect(
      parseDurationBreakdown(
        '   Duration  9.27s (transform 5.08s, setup 7.58s, import 18.80s, tests 7.64s, environment 73.60s)',
      )?.phases,
    ).toEqual({ transform: 5, setup: 7, import: 17, tests: 7, environment: 65 })
  })
  it('reads a run measured in milliseconds', () => {
    const breakdown = parseDurationBreakdown(
      'Duration  185ms (tests 120ms, environment 30ms)',
    )
    expect(breakdown?.seconds).toBeCloseTo(0.185)
    expect(breakdown?.phases).toEqual({ tests: 80, environment: 20 })
  })
  it('returns null when the line is missing', () => {
    expect(parseDurationBreakdown('no summary')).toBeNull()
  })
})
