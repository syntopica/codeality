import { describe, expect, it } from 'vitest'

import { codegenDialectOf } from '@/audit/codegenDialectOf.js'

describe('codegenDialectOf', () => {
  it.each([
    ['postgres://u:p@h/d', 'postgres'],
    ['postgresql://u:p@h/d', 'postgres'],
    ['mysql://u:p@h/d', 'mysql'],
    ['mongodb://u:p@h/d', undefined],
    ['not a url', undefined],
  ])('%s -> %s', (url, expected) => {
    expect(codegenDialectOf(url)).toBe(expected)
  })
})
