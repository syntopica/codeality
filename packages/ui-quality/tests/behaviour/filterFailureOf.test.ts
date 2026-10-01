import { describe, expect, it } from 'vitest'

import { filterFailureOf } from '@/behaviour/filterFailureOf.js'

const page = (word: string, count: number) =>
  Array.from({ length: count }, (_, index) => `${word} ${String(index)}`)

describe('filterFailureOf', () => {
  it('accepts a full page of matches in place of a full page of rows', () => {
    const before = [...page('Abono', 25), ...page('Notificación', 25)]
    expect(
      filterFailureOf('Notificación', before, page('Notificacion', 50)),
    ).toBeNull()
  })
  it('reports a search that keeps every row, matching or not', () => {
    const before = [...page('Abono', 3), ...page('Recibo', 3)]
    expect(filterFailureOf('Abono', before, before)?.message).toContain(
      'kept all 6 rows',
    )
  })
  it('reports a search that hides the rows showing the word', () => {
    expect(filterFailureOf('Abono', page('Abono', 2), [])?.message).toContain(
      'left no rows',
    )
  })
})
