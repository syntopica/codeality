import { describe, expect, it } from 'vitest'

import { collectionPaginationFailureOf } from '@/behaviour/collectionPaginationFailureOf.js'

const FIRST = { items: ['a', 'b', 'c', 'd'], url: '/list' }

describe('collectionPaginationFailureOf', () => {
  it('accepts a pager that moves forward and back', () => {
    expect(
      collectionPaginationFailureOf(
        FIRST,
        { items: ['e', 'f', 'g', 'h'], url: '/list/2' },
        ['d', 'c', 'b', 'a'],
      ),
    ).toBeNull()
  })
  it('reports a new address that shows the same items', () => {
    expect(
      collectionPaginationFailureOf(
        FIRST,
        { items: ['b', 'a', 'c', 'd'], url: '/list/2' },
        null,
      )?.message,
    ).toBe(
      '"next page" opens /list/2 but it shows the same 4 items as the first page',
    )
  })
  it('reports a link that changes neither the address nor the items', () => {
    expect(
      collectionPaginationFailureOf(FIRST, { ...FIRST }, null)?.message,
    ).toBe('"next page" leaves both the address and the 4 items unchanged')
  })
  it('reports a next page that repeats more than half of the first', () => {
    expect(
      collectionPaginationFailureOf(
        FIRST,
        { items: ['b', 'c', 'd', 'e'], url: '/list/2' },
        null,
      )?.message,
    ).toBe(
      '"next page" repeats 3 of its 4 items from the first page, so others are never shown',
    )
  })
  it('accepts a next page that repeats half of the first or less', () => {
    expect(
      collectionPaginationFailureOf(
        FIRST,
        { items: ['c', 'd', 'e', 'f'], url: '/list/2' },
        null,
      ),
    ).toBeNull()
  })
  it('reports a previous page that does not return to the first set', () => {
    expect(
      collectionPaginationFailureOf(
        FIRST,
        { items: ['e', 'f', 'g', 'h'], url: '/list/2' },
        ['a', 'b', 'c', 'e'],
      )?.subject,
    ).toBe('previous page')
  })
  it('leaves an empty next page to other rules', () => {
    expect(
      collectionPaginationFailureOf(FIRST, { items: [], url: '/list/2' }, null),
    ).toBeNull()
  })
})
