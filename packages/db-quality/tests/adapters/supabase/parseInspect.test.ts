import { describe, expect, it } from 'vitest'

import { parseBloat } from '@/adapters/supabase/parseBloat.js'
import { parseIndexStats } from '@/adapters/supabase/parseIndexStats.js'

const row = (
  name: string,
  scans: string,
  unused: boolean,
): Record<string, unknown> => ({
  name,
  table: 'public.a',
  columns: 'x',
  size: '8 kB',
  percent_used: '0%',
  index_scans: scans,
  seq_scans: '4',
  unused,
})

describe('parseIndexStats', () => {
  it('reports unused indexes but never primary keys', () => {
    const stdout = JSON.stringify({
      rows: [
        row('public.a_idx', '0', true),
        row('public.a_pkey', '0', true),
        row('public.b_idx', '25711', false),
      ],
    })
    expect(
      parseIndexStats(stdout, []).map((f) => [f.code, f.subject, f.severity]),
    ).toEqual([['BDB601', 'public.a_idx', 'info']])
    expect(parseIndexStats(stdout, ['BDB601'])).toEqual([])
  })
})

describe('parseBloat', () => {
  it('reports rows over the threshold', () => {
    const stdout = JSON.stringify({
      rows: [
        { type: 'table', name: 'public.plans', bloat: '3.8', waste: '200 kB' },
        { type: 'table', name: 'public.big', bloat: '7.1', waste: '3 MB' },
      ],
    })
    expect(
      parseBloat(stdout, 5, []).map((f) => [f.code, f.subject, f.message]),
    ).toEqual([['BDB602', 'public.big', 'bloat factor 7.1, 3 MB wasted']])
    expect(parseBloat(stdout, 5, ['BDB602'])).toEqual([])
  })
})
