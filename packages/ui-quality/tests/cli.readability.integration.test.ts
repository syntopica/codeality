import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const BROKEN = '/readability.html'
const CLEAN = '/readability-clean.html'
const EXPECTED = ['gray-on-color', 'line-length', 'text-cramped']

describe('codeality-ui readability rules', () => {
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
