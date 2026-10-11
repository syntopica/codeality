import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui narrow-page', () => {
  it('reports a report page capped narrow at 1600 and 1920px, not its wide twin or a reading page', async () => {
    const findings = await fixtureFindings({
      routes: ['/narrow.html', '/narrow-clean.html', '/narrow-reading.html'],
      viewports: [
        { width: 1600, height: 900 },
        { width: 1920, height: 1080 },
      ],
    })
    const on = (route: string) =>
      findings
        .filter(
          (finding) =>
            finding.route === route && finding.rule === 'narrow-page',
        )
        .map((finding) => [finding.severity, finding.screens])
    expect(on('/narrow.html')).toEqual([
      ['error', ['1600x900 light', '1920x1080 light']],
    ])
    expect(on('/narrow-clean.html')).toEqual([])
    expect(on('/narrow-reading.html')).toEqual([])
  }, 120_000)
})
