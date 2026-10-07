import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const BROKEN = '/tells.html'
const CLEAN = '/tells-clean.html'
const EXPECTED = [
  'gradient-text',
  'glow-shadow',
  'side-stripe-accent',
  'eyebrow-label',
  'pulsing-decoration',
  'purple-gradient',
]

describe('codeality-ui machine-made look rules', () => {
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
