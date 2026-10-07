import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const rulesOf = async (route: string): Promise<string[]> =>
  (
    await fixtureFindings({ routes: [route], colorSchemes: ['light', 'dark'] })
  ).map((finding) => finding.rule)

describe('codeality-ui dark scheme', () => {
  it('warns when the dark pass renders the light page again', async () => {
    expect(await rulesOf('/fixed.html')).toEqual(['dark-scheme-ignored'])
  }, 120_000)
  it('stays quiet on a page that honours prefers-color-scheme', async () => {
    expect(await rulesOf('/broken.html')).not.toContain('dark-scheme-ignored')
  }, 120_000)
})
