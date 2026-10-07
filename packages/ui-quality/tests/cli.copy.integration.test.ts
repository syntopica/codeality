import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const BROKEN = '/copy.html'
const CLEAN = '/copy-clean.html'
const EXPECTED = [
  'ascii-ellipsis',
  'label-punctuation',
  'placeholder-as-label',
  'time-without-datetime',
]

describe('codeality-ui copy and label rules', () => {
  it('leaves label-punctuation off unless the project enables it', async () => {
    const findings = await fixtureFindings({ routes: [BROKEN] })
    expect(
      findings.filter((finding) => finding.rule === 'label-punctuation'),
    ).toEqual([])
  }, 120_000)
  it('reports every defect on the broken page and none on its twin', async () => {
    const findings = await fixtureFindings({
      routes: [BROKEN, CLEAN],
      enable: ['label-punctuation'],
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
