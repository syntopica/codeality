import { describe, expect, it } from 'vitest'

import { isWholeTableWrite } from '@/adapters/sqlite/isWholeTableWrite.js'

const statement = (text: string) => ({ text, line: 1 })

describe('isWholeTableWrite', () => {
  it('accepts a DELETE or UPDATE with no WHERE', () => {
    expect(isWholeTableWrite(statement('DELETE FROM jobs'))).toBe(true)
    expect(isWholeTableWrite(statement("update jobs set state = 'a'"))).toBe(
      true,
    )
  })
  it('rejects a filtered write and a read', () => {
    expect(isWholeTableWrite(statement('DELETE FROM jobs WHERE id = ?1'))).toBe(
      false,
    )
    expect(isWholeTableWrite(statement('SELECT * FROM jobs'))).toBe(false)
  })
})
