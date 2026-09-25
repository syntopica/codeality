import { describe, expect, it } from 'vitest'

import { statementAtLine } from '@/sql/statementAtLine.js'

const file = {
  path: 'a.sql',
  statements: [
    { text: 'select 1', line: 1 },
    { text: 'select\n2', line: 4 },
  ],
}

describe('statementAtLine', () => {
  it('returns the statement covering the line', () => {
    expect(statementAtLine(file, 5)?.line).toBe(4)
    expect(statementAtLine(file, 2)?.line).toBe(1)
  })
  it('returns undefined before the first statement', () => {
    expect(statementAtLine(file, 0)).toBeUndefined()
  })
})
