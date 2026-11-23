import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui text-clipped beside unused room', () => {
  it('reports the ellipsis whose neighbour has room to spare, alone', async () => {
    const findings = await fixtureFindings({
      routes: ['/truncate-slack.html'],
    })
    expect(
      findings
        .filter((finding) => finding.rule === 'text-clipped')
        .map((finding) => finding.subject),
    ).toEqual(['span#slack'])
  }, 120_000)
})
