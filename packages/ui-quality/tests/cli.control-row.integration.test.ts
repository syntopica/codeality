import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui control-row-ragged', () => {
  it('reports the ragged edit row and passes the even row and the wrapped toolbar', async () => {
    const findings = await fixtureFindings({
      routes: ['/control-row.html', '/control-row-clean.html'],
    })
    const on = (route: string) =>
      findings.filter(
        (finding) =>
          finding.route === route && finding.rule === 'control-row-ragged',
      )
    const ragged = on('/control-row.html')
    expect(ragged).toHaveLength(1)
    expect(ragged[0]?.message).toMatch(
      /^4 controls on one line do not line up \(heights 32-36px, centres \d+px apart, text 12px vs 14px\)/,
    )
    expect(on('/control-row-clean.html')).toEqual([])
  }, 120_000)
})
