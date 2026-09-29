import { describe, expect, it } from 'vitest'

import { scannedTables } from '@/adapters/sqlite/scannedTables.js'

const tables = new Map([
  ['jobs', 'jobs'],
  ['message_placements', 'message_placements'],
  ['recent', 'recent'],
])

describe('scannedTables', () => {
  it('resolves aliases to their tables', () => {
    expect(
      scannedTables(
        'SELECT count(*) FROM messages m JOIN message_placements AS p ON p.id = m.id, jobs j',
        [
          'SCAN p USING COVERING INDEX pk',
          'SCAN j',
          'SEARCH m USING INTEGER PRIMARY KEY (rowid=?)',
        ],
        tables,
      ).map((scan) => [scan.table, scan.kind]),
    ).toEqual([
      ['message_placements', 'index'],
      ['jobs', 'table'],
    ])
  })
  it('ignores CTEs, even one shadowing a table, and unknown names', () => {
    expect(
      scannedTables(
        'WITH recent AS (SELECT id FROM jobs WHERE state = ?1), x(a) AS MATERIALIZED (SELECT 1) SELECT * FROM recent, x, (SELECT 1) s',
        ['SCAN recent', 'SCAN x', 'SCAN s', 'SCAN (subquery-3)'],
        tables,
      ),
    ).toEqual([])
  })
  it('does not take a keyword for an alias', () => {
    expect(
      scannedTables(
        'SELECT id FROM jobs WHERE state = ?1',
        ['SCAN jobs'],
        tables,
      ).map((scan) => scan.table),
    ).toEqual(['jobs'])
  })
})
