import { describe, expect, it } from 'vitest'

import { clickFailed } from '@/rules/clickFailed.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('clickFailed', () => {
  it('reports a click that found no target', () => {
    const findings = clickFailed(
      snapshotOf([], { clickFailures: ['text=Clientes'] }),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.identity)).toEqual([
      'text=Clientes',
    ])
  })
  it('stays quiet when every click landed', () => {
    expect(clickFailed(snapshotOf([]), ruleContext())).toEqual([])
  })
})
