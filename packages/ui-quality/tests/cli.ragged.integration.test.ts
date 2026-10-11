import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui ragged-column', () => {
  it('reports the capped blocks around a full-width card and none on its fixed twin', async () => {
    const findings = await fixtureFindings({
      routes: ['/ragged.html', '/ragged-clean.html'],
    })
    const on = (route: string) =>
      findings
        .filter(
          (finding) =>
            finding.route === route && finding.rule === 'ragged-column',
        )
        .map((finding) => finding.subject)
    expect(on('/ragged.html').toSorted()).toEqual(
      ['main > div.note', 'main > p.transcript'].toSorted(),
    )
    expect(on('/ragged-clean.html')).toEqual([])
  }, 120_000)
})
