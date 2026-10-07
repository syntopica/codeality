import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

// The probe-driven rules shipped together, plus the two candidates that
// existing checks already cover: a viewport that disables zoom is axe's
// meta-viewport, and an uncaught exception is a console error.
const EXPECTED = [
  'undersized-text',
  'tight-leading',
  'letter-spacing',
  'numeric-alignment',
  'broken-image',
  'unstable-media-size',
  'content-hidden-at-rest',
  'a11y/meta-viewport',
  'console-error',
]

describe('codeality-ui typography and media rules', () => {
  it('reports every defect on the broken page and none on its fixed twin', async () => {
    const findings = await fixtureFindings({
      routes: ['/typography.html', '/typography-clean.html'],
    })
    const rulesOn = (route: string): string[] =>
      [
        ...new Set(
          findings
            .filter((finding) => finding.route === route)
            .map((finding) => finding.rule),
        ),
      ].filter((rule) => EXPECTED.includes(rule))
    expect(rulesOn('/typography.html').toSorted()).toEqual(EXPECTED.toSorted())
    expect(rulesOn('/typography-clean.html')).toEqual([])
  }, 120_000)
})
