import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui palette tokens off the root', () => {
  it('reads tokens the shell around the main region declares, and no others', async () => {
    const findings = await fixtureFindings({
      routes: ['/scoped-tokens.html'],
      palette: {
        variablePrefixes: ['--brand-'],
        colors: ['#ffffff', '#000000'],
      },
    })
    expect(
      findings
        .filter((finding) => finding.rule === 'palette')
        .map((finding) => finding.subject),
    ).toEqual(['div.shell > main > p.stray'])
  }, 120_000)
})
