import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const ROUTE = '/searchable-dropdown.html'

describe('codeality-ui searchable-dropdown', () => {
  it('leaves the rule off by default', async () => {
    const findings = await fixtureFindings({ routes: [ROUTE] })
    expect(
      findings.filter((finding) => finding.rule === 'searchable-dropdown'),
    ).toEqual([])
  }, 120_000)

  it('reports native single selects and open, non-searchable listbox triggers', async () => {
    const findings = await fixtureFindings({
      routes: [ROUTE],
      enable: ['searchable-dropdown'],
    })
    expect(
      findings
        .filter((finding) => finding.rule === 'searchable-dropdown')
        .map((finding) => finding.subject)
        .toSorted(),
    ).toEqual([
      'button#readonly-search',
      'button#select-only',
      'select#drawn',
      'select#native',
    ])
  }, 120_000)
})
