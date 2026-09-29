import { describe, expect, it } from 'vitest'

import { planDetails } from '@/adapters/sqlite/planDetails.js'

describe('planDetails', () => {
  it('strips the tree the shell draws', () => {
    expect(
      planDetails(
        [
          'QUERY PLAN',
          '|--SEARCH jobs USING COVERING INDEX idx_jobs (state=?)',
          '|--LIST SUBQUERY 1',
          '|  `--SCAN json_each VIRTUAL TABLE INDEX 1:',
          '`--USE TEMP B-TREE FOR ORDER BY',
          '',
        ].join('\n'),
      ),
    ).toEqual([
      'SEARCH jobs USING COVERING INDEX idx_jobs (state=?)',
      'LIST SUBQUERY 1',
      'SCAN json_each VIRTUAL TABLE INDEX 1:',
      'USE TEMP B-TREE FOR ORDER BY',
    ])
  })
  it('reads JSON rows and an empty plan', () => {
    expect(
      planDetails('[{"id":2,"parent":0,"notused":0,"detail":"SCAN t"}]'),
    ).toEqual(['SCAN t'])
    expect(planDetails('')).toEqual([])
  })
})
