import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

// The composition rules, plus the two halves of the media rules that read the
// capture rather than the DOM: the layout shift observed from an init script,
// and a CSS background image whose request failed.
const EXPECTED = [
  'nested-cards',
  'type-scale-sprawl',
  'accent-overuse',
  'text-occlusion',
  'unstable-media-size',
  'broken-image',
]

describe('codeality-ui composition rules', () => {
  it('reports every defect on the broken page and none on its fixed twin', async () => {
    const findings = await fixtureFindings({
      routes: ['/composition.html', '/composition-clean.html'],
    })
    const on = (route: string) =>
      findings.filter(
        (finding) => finding.route === route && EXPECTED.includes(finding.rule),
      )
    const defects = on('/composition.html')
    expect([...new Set(defects.map((f) => f.rule))].toSorted()).toEqual(
      EXPECTED.toSorted(),
    )
    const messages = defects.map((finding) => finding.message).join('\n')
    expect(messages).toContain('cumulative layout shift')
    expect(messages).toContain('CSS background image missing-banner.png')
    expect(on('/composition-clean.html')).toEqual([])
  }, 120_000)
})
