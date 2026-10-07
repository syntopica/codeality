import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const paginationFindings = async (route: string): Promise<string[]> =>
  (await fixtureFindings({ routes: [route] }))
    .filter((finding) => finding.rule.startsWith('pagination-'))
    .map((finding) => `${finding.rule} ${finding.subject}`)

describe('codeality-ui pagination on a card grid with no table', () => {
  it('follows a pager that loads another page of cards and back', async () => {
    expect(await paginationFindings('/grid.html')).toEqual([])
  })
  it('reports a next page that shows the same cards', async () => {
    expect(await paginationFindings('/grid.html#same')).toEqual([
      'pagination-broken next page',
    ])
  })
  it('reports a next page that repeats most of the first page', async () => {
    expect(await paginationFindings('/grid.html#overlap')).toEqual([
      'pagination-broken next page',
    ])
  })
  it('reports a numbered link to page 2 that changes neither address nor cards', async () => {
    expect(await paginationFindings('/grid.html#stuck')).toEqual([
      'pagination-broken next page',
    ])
  })
  it('leaves a next-article link alone when no numbered page backs it', async () => {
    expect(await paginationFindings('/article.html')).toEqual([])
  })
  it('reports a long list rendered whole with no pager', async () => {
    expect(await paginationFindings('/list.html')).toEqual([
      'pagination-missing main list',
    ])
    expect(await paginationFindings('/list.html#short')).toEqual([])
  })
})
