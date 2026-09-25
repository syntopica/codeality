import { describe, expect, it } from 'vitest'

import { parseSodaResults } from '@/adapters/soda/parseSodaResults.js'

const json = JSON.stringify({
  checks: [
    {
      name: 'duplicate_count(email) = 0',
      outcome: 'fail',
      table: 'users',
      column: 'email',
    },
    { name: 'row_count > 0', outcome: 'pass', table: 'users' },
    {
      name: 'missing_count(id) = 0',
      outcome: 'warn',
      table: 'users',
      column: 'id',
    },
  ],
})

describe('parseSodaResults', () => {
  it('reports failed and warned checks only', () => {
    expect(
      parseSodaResults(json, 'db-quality/soda', []).map((f) => [
        f.code,
        f.severity,
        f.subject,
        f.path,
        f.message,
      ]),
    ).toEqual([
      [
        'BDB700/duplicate_count(email) = 0',
        'error',
        'users.email',
        'db-quality/soda/checks.yml',
        'check failed: duplicate_count(email) = 0',
      ],
      [
        'BDB700/missing_count(id) = 0',
        'warn',
        'users.id',
        'db-quality/soda/checks.yml',
        'check warned: missing_count(id) = 0',
      ],
    ])
  })
  it('drops disabled checks', () => {
    expect(
      parseSodaResults(json, 'd', ['BDB700/duplicate_count(email) = 0']).map(
        (f) => f.code,
      ),
    ).toEqual(['BDB700/missing_count(id) = 0'])
  })
})
