import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui focus-invisible', () => {
  it('reports the elements whose focus ring was reset and none on the page that keeps one', async () => {
    const findings = await fixtureFindings({
      routes: ['/focus.html', '/focus-clean.html'],
    })
    const subjects = (route: string): string[] =>
      findings
        .filter(
          (finding) =>
            finding.route === route && finding.rule === 'focus-invisible',
        )
        .map((finding) => finding.message)
    expect(subjects('/focus.html')).toHaveLength(3)
    expect(subjects('/focus-clean.html')).toEqual([])
  }, 120_000)
})
