import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui axe target-size', () => {
  it('reports controls too small and too close to tap alone', async () => {
    const findings = await fixtureFindings({ routes: ['/targets.html'] })
    expect(findings.map((finding) => finding.rule)).toContain(
      'a11y/target-size',
    )
  }, 120_000)
})
