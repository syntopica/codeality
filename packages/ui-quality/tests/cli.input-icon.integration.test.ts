import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui input-icon-misaligned', () => {
  it('reports the misaligned date picker and overlaid svg, not the centred ones', async () => {
    const findings = await fixtureFindings({ routes: ['/input-icon.html'] })
    expect(
      findings
        .filter((finding) => finding.rule === 'input-icon-misaligned')
        .map((finding) => finding.subject)
        .sort(),
    ).toEqual(['input#bad-date', 'input#bad-text'])
  }, 120_000)
})
