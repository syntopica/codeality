import { describe, expect, it } from 'vitest'

import { consoleError } from '@/rules/consoleError.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('consoleError', () => {
  it('reports each distinct console error once, without format arguments', () => {
    const findings = consoleError(
      snapshotOf([], {
        consoleErrors: [
          '%c%s%c [i18n] MISSING_MESSAGE: tags.tableLabel background: #e6e6e6; color: #000;',
          '%c%s%c [i18n] MISSING_MESSAGE: tags.tableLabel background: #e6e6e6; color: #000;',
          'Encountered two children with the same key',
        ],
      }),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.identity)).toEqual([
      '[i18n] MISSING_MESSAGE: tags.tableLabel',
      'Encountered two children with the same key',
    ])
  })
  it('stays quiet on a page that logs nothing', () => {
    expect(consoleError(snapshotOf([]), ruleContext())).toEqual([])
  })
})
