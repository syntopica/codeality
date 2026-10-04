import { describe, expect, it } from 'vitest'

import { parseProcessTable } from '@/measure/parseProcessTable.js'
import { treeRssKb } from '@/measure/treeRssKb.js'

const TABLE = `  10     1  1000
  20    10  2000
  30    20  4000
  40     1  8000
 bad line
`

describe('treeRssKb', () => {
  it('sums a process and every descendant, and nothing else', () => {
    const rows = parseProcessTable(TABLE)
    expect(rows).toHaveLength(4)
    expect(treeRssKb(rows, 10)).toBe(7000)
    expect(treeRssKb(rows, 20)).toBe(6000)
  })
  it('is zero for a process that is gone', () => {
    expect(treeRssKb(parseProcessTable(TABLE), 99)).toBe(0)
  })
})
