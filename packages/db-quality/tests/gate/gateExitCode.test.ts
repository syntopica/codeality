import { describe, expect, it } from 'vitest'

import { gateExitCode } from '@/gate/gateExitCode.js'
import { runGate } from '@/gate/runGate.js'
import type { StageResult } from '@/gate/StageResult.js'

const result = (status: StageResult['status']): StageResult => ({
  name: 's',
  status,
  durationSeconds: 0,
  detail: '',
})

describe('gateExitCode', () => {
  it('ranks failed-to-run over findings over everything else', () => {
    expect(
      gateExitCode([result('passed'), result('skipped-not-applicable')]),
    ).toBe(0)
    expect(gateExitCode([result('passed'), result('findings')])).toBe(1)
    expect(gateExitCode([result('findings'), result('failed-to-run')])).toBe(3)
  })
  it('runs every stage even after a failure', () => {
    const results = runGate([
      {
        name: 'a',
        run: () => {
          throw new Error('x')
        },
      },
      { name: 'b', run: () => [] },
    ])
    expect(results.map((r) => r.status)).toEqual(['failed-to-run', 'passed'])
  })
})
