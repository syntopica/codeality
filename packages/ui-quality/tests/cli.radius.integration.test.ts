import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const BROKEN = '/radius.html'
const CLEAN = '/radius-clean.html'
const RULES = ['radius-sprawl', 'card-radius-admin']

describe('codeality-ui corner radius rules', () => {
  it('reports radius sprawl on the broken page, pills and circles aside, and none on a scale', async () => {
    const findings = await fixtureFindings({
      routes: [BROKEN, CLEAN],
    })
    const on = (route: string) =>
      findings.filter(
        (finding) => finding.route === route && RULES.includes(finding.rule),
      )
    expect(on(BROKEN).map((finding) => finding.rule)).toEqual(['radius-sprawl'])
    expect(on(BROKEN)[0]?.message).toContain('2, 4, 6, 10, 16px')
    expect(on(CLEAN)).toEqual([])
  }, 120_000)
  it('holds cards to 8px only when the project says it is a product UI', async () => {
    const findings = await fixtureFindings({
      routes: [BROKEN, CLEAN],
      register: 'product',
    })
    const cards = findings.filter(
      (finding) => finding.rule === 'card-radius-admin',
    )
    expect(cards.map((finding) => finding.route)).toEqual([BROKEN])
    expect(cards[0]?.message).toContain('16px')
  }, 120_000)
})
