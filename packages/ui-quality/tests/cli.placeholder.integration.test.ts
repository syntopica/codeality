import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui placeholder-fit', () => {
  it('reports the empty fields whose placeholder runs past them, not a text area that wraps it into view', async () => {
    const findings = await fixtureFindings({ routes: ['/placeholder.html'] })
    expect(
      findings
        .filter((finding) => finding.rule === 'placeholder-fit')
        .map((finding) => finding.subject),
    ).toEqual(['main > input', 'main > textarea.cramped'])
  }, 120_000)
})
