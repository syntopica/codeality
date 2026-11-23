import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

// Rows of a list under a phone tab bar fixed to the bottom of the window: the
// bar covers whichever row sits at the fold, and every row scrolls clear.
describe('codeality-ui on rows under a phone tab bar', () => {
  it('reports nothing against the bar', async () => {
    const findings = await fixtureFindings({
      routes: ['/tab-bar-clean.html'],
      viewports: [{ width: 390, height: 844, mobile: true }],
    })
    const rules = findings.map((finding) => finding.rule)
    expect(rules).not.toContain('touch-target')
    expect(rules).not.toContain('text-occlusion')
  })
})
