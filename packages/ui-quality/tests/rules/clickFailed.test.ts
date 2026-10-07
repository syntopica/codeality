import { describe, expect, it } from 'vitest'

import { clickFailed } from '@/rules/clickFailed.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('clickFailed', () => {
  it('reports a click that found no target', () => {
    const findings = clickFailed(
      snapshotOf([], {
        interactionFailures: [{ action: 'click', selector: 'text=Clientes' }],
      }),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.identity)).toEqual([
      'text=Clientes',
    ])
  })
  it('names the scroll, hover or focus that found no target', () => {
    const [finding] = clickFailed(
      snapshotOf([], {
        interactionFailures: [{ action: 'hover', selector: 'tbody tr' }],
      }),
      ruleContext(),
    )
    expect(finding?.identity).toBe('hover tbody tr')
    expect(finding?.message).toContain('nothing matched "tbody tr" to hover')
  })
  it('stays quiet when every click landed', () => {
    expect(clickFailed(snapshotOf([]), ruleContext())).toEqual([])
  })
})
