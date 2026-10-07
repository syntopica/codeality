import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui ghost-elevation', () => {
  it('reports a bordered card with a real shadow and nothing else', async () => {
    const findings = await fixtureFindings({ routes: ['/elevation.html'] })
    expect(
      findings
        .filter((finding) => finding.rule === 'ghost-elevation')
        .map((finding) => finding.subject),
    ).toEqual(['main > section.ghost'])
  }, 120_000)
})
