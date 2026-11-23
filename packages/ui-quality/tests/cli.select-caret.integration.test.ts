import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui cramped-select-caret', () => {
  it('reports the padded native select alone', async () => {
    const findings = await fixtureFindings({ routes: ['/select-caret.html'] })
    expect(
      findings
        .filter((finding) => finding.rule === 'cramped-select-caret')
        .map((finding) => finding.subject),
    ).toEqual(['select#cramped'])
  }, 120_000)
})
