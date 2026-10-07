import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const BROKEN = '/spacing.html'
const CLEAN = '/spacing-clean.html'
const EXPECTED = ['off-scale-spacing', 'heading-rhythm', 'group-gap-ratio']

describe('codeality-ui spacing and grouping rules', () => {
  it('reports every defect on the broken page and none on its twin', async () => {
    const findings = await fixtureFindings({ routes: [BROKEN, CLEAN] })
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
