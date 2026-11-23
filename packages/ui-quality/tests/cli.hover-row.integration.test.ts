import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const contrastFindings = async (
  route: Record<string, unknown>,
): Promise<number> =>
  (await fixtureFindings({ routes: [route] })).filter((finding) =>
    finding.rule.includes('contrast'),
  ).length

describe('codeality-ui pointer after a click', () => {
  it('does not measure the hover colours of the row a click left the pointer on', async () => {
    expect(
      await contrastFindings({ path: '/hover-row.html', click: ['#open'] }),
    ).toBe(0)
  }, 120_000)
  it('still measures a hover the route asks for', async () => {
    expect(
      await contrastFindings({ path: '/hover-row.html', hover: '#row' }),
    ).toBeGreaterThan(0)
  }, 120_000)
})
