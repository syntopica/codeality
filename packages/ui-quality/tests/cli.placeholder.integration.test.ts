import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui placeholder-fit', () => {
  it('reports the empty field whose placeholder runs past it, alone', async () => {
    const findings = await fixtureFindings({ routes: ['/placeholder.html'] })
    expect(
      findings
        .filter((finding) => finding.rule === 'placeholder-fit')
        .map((finding) => finding.subject),
    ).toEqual(['main > input'])
  }, 120_000)
})
