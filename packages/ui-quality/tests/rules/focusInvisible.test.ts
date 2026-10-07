import { describe, expect, it } from 'vitest'

import { focusInvisible } from '@/rules/focusInvisible.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('focusInvisible', () => {
  it('reports an element whose focus changed nothing and accepts one that showed a ring', () => {
    const findings = focusInvisible(
      snapshotOf(
        [
          elementBox({ id: 0, tag: 'button', selector: 'button.ghost' }),
          elementBox({ id: 1, tag: 'a', selector: 'a.nav' }),
        ],
        {
          focusStops: [
            { element: 0, changed: false },
            { element: 1, changed: true },
          ],
        },
      ),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.subject)).toEqual(['button.ghost'])
    expect(findings[0]?.severity).toBe('warn')
  })
  it('stays quiet without a Tab pass', () => {
    expect(focusInvisible(snapshotOf([]), ruleContext())).toEqual([])
  })
})
