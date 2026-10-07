import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const behaviourRules = async (route: string): Promise<string[]> =>
  (await fixtureFindings({ routes: [route] }))
    .map((finding) => finding.rule)
    .filter((rule) => rule.endsWith('-broken') || rule.endsWith('-missing'))

describe('codeality-ui behaviour on grouped and covered lists', () => {
  it('follows a row that moves to another table of the same list', async () => {
    expect(await behaviourRules('/grouped.html')).toEqual([])
  })
  it('leaves a list alone while a dialog covers it', async () => {
    expect(await behaviourRules('/grouped.html#modal')).toEqual([])
  })
})
