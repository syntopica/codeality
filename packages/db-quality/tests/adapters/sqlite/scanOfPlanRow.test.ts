import { describe, expect, it } from 'vitest'

import { scanOfPlanRow } from '@/adapters/sqlite/scanOfPlanRow.js'

describe('scanOfPlanRow', () => {
  it('reads table and index scans in the current and the old spelling', () => {
    expect(scanOfPlanRow('SCAN j')).toEqual({
      name: 'j',
      kind: 'table',
      detail: 'SCAN j',
    })
    expect(
      scanOfPlanRow(
        'SCAN p USING COVERING INDEX sqlite_autoindex_message_placements_1',
      )?.kind,
    ).toBe('index')
    expect(scanOfPlanRow('SCAN t USING INDEX idx_t')?.kind).toBe('index')
    expect(scanOfPlanRow('SCAN TABLE jobs AS j')).toMatchObject({
      name: 'jobs',
      kind: 'table',
    })
  })
  it('ignores what is not a table read', () => {
    for (const detail of [
      'SCAN (subquery-1)',
      'SCAN CONSTANT ROW',
      'SCAN json_each VIRTUAL TABLE INDEX 1:',
      'SEARCH jobs USING INDEX idx_jobs (state=?)',
      'USE TEMP B-TREE FOR ORDER BY',
    ])
      expect(scanOfPlanRow(detail)).toBeUndefined()
  })
})
