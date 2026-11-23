import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui false positives seen on a ticketing site', () => {
  it('leaves a hidden skip link, a period filter and a link button alone', async () => {
    const findings = await fixtureFindings({
      routes: ['/link-button-clean.html'],
    })
    const rules = new Set([
      'text-clipped',
      'text-occlusion',
      'time-without-datetime',
      'nested-cards',
      'ragged-column',
    ])
    expect(findings.filter((finding) => rules.has(finding.rule))).toEqual([])
  }, 120_000)
  it('still judges a clip that shows its box and a linked card inside a card', async () => {
    const findings = await fixtureFindings({ routes: ['/link-button.html'] })
    const rules = new Set(['text-clipped', 'nested-cards'])
    expect(
      findings
        .filter((finding) => rules.has(finding.rule))
        .map((finding) => `${finding.rule} ${finding.subject}`)
        .sort(),
    ).toEqual([
      'nested-cards main#main > div.card.wide',
      'text-clipped main#main > div.stage > p.shown',
    ])
  }, 120_000)
})
