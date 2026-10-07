import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui select text', () => {
  it('reports the select too short for its line and passes the roomy one', async () => {
    const findings = await fixtureFindings({ routes: ['/select.html'] })
    const clipped = findings.filter(
      (finding) =>
        finding.rule === 'text-clipped' && finding.message.includes('select'),
    )
    expect(clipped).toHaveLength(1)
    expect(clipped[0]?.message).toMatch(/10px content box/)
  }, 120_000)
})
