import { describe, expect, it } from 'vitest'

import { renderGateReport } from '@/gate/renderGateReport.js'

describe('renderGateReport', () => {
  it('prints one line per stage and the detail of the ones that did not pass', () => {
    expect(
      renderGateReport([
        { name: 'check', status: 'passed', durationSeconds: 1.234, detail: '' },
        {
          name: 'audit',
          status: 'failed-to-run',
          durationSeconds: 0.5,
          detail: 'supabase advisors failed: X: status 403',
        },
      ]),
    ).toBe(
      '                passed  check             1.23s\n         failed-to-run  audit             0.50s\n  supabase advisors failed: X: status 403',
    )
  })
})
