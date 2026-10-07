import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui console-error', () => {
  it('does not report what axe logs while it reads the stylesheets', async () => {
    const findings = await fixtureFindings({ routes: ['/csp.html'] })
    expect(findings.map((finding) => finding.rule)).not.toContain(
      'console-error',
    )
  })
})
