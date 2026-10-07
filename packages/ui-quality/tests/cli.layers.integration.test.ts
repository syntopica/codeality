import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const BROKEN = '/layers.html'
const CLEAN = '/layers-clean.html'
const EXPECTED = [
  'clipped-popover',
  'z-index-sprawl',
  'dark-scheme-incomplete',
  'page-scroll-thread',
]

describe('codeality-ui stacking, theming and scrolling rules', () => {
  it('reports every defect on the broken page and none on its twin', async () => {
    const findings = await fixtureFindings({
      routes: [BROKEN, CLEAN],
      colorSchemes: ['dark'],
    })
    const rulesOn = (route: string): string[] =>
      [
        ...new Set(
          findings
            .filter((finding) => finding.route === route)
            .map((finding) => finding.rule),
        ),
      ]
        .filter((rule) => EXPECTED.includes(rule))
        .toSorted()
    expect(rulesOn(BROKEN)).toEqual(EXPECTED.toSorted())
    expect(rulesOn(CLEAN)).toEqual([])
  }, 120_000)
})
