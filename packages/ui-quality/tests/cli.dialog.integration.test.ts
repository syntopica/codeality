import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const emptyDialogsOf = async (path: string): Promise<string[]> =>
  (
    await fixtureFindings({
      routes: [{ path, click: ['#open'] }],
      viewports: [{ width: 390, height: 844, mobile: true }],
    })
  )
    .filter((finding) => finding.rule === 'empty-dialog')
    .map((finding) => finding.subject)

describe('codeality-ui empty dialog', () => {
  it('reports a drawer that opens onto nothing but its close button', async () => {
    expect(await emptyDialogsOf('/drawer.html#empty')).toEqual(['div.drawer'])
  }, 120_000)
  it('passes the drawer once its links arrive', async () => {
    expect(await emptyDialogsOf('/drawer.html')).toEqual([])
  }, 120_000)
})
