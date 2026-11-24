import { describe, expect, it } from 'vitest'

import { repeatedRowAction } from '@/rules/repeatedRowAction.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { tableOf } from '@tests/tableOf.js'
import { withRowButtons } from '@tests/withRowButtons.js'

const LABEL = 'Documentos candidatos'

describe('repeatedRowAction', () => {
  it('reports one label repeated on four rows', () => {
    const findings = repeatedRowAction(
      snapshotOf(withRowButtons(tableOf({ rows: 4 }), () => LABEL)),
      ruleContext(),
    )
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toContain(LABEL)
  })
  it('accepts three rows, distinct labels and buttons with no text', () => {
    for (const [rows, label] of [
      [3, () => LABEL],
      [6, (i: number) => `Open ${String(i)}`],
      [6, () => ''],
    ] as const)
      expect(
        repeatedRowAction(
          snapshotOf(withRowButtons(tableOf({ rows }), label)),
          ruleContext(),
        ),
      ).toEqual([])
  })
})
