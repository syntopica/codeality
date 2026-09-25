import { describe, expect, it } from 'vitest'

import { isPlatformNoise } from '@/perf/isPlatformNoise.js'

describe('isPlatformNoise', () => {
  it('drops the statements Supabase and PostgREST run on their own', () => {
    for (const text of [
      'select pg_sleep($1)',
      'SELECT name FROM pg_timezone_names',
      'WITH -- Recursively get the base types of domains base_types AS (',
      'SELECT wal->>$5 as type, wal->>$6 as schema',
      'COPY public.llm_debug_events (id) TO STDOUT',
      'select * from pg_stat_statements',
      "select coalesce(json_agg(t), '[]'::json) from (select 1) t",
    ])
      expect(isPlatformNoise(text, [])).toBe(true)
  })
  it('keeps the application and honours perf.ignore', () => {
    expect(isPlatformNoise('WITH pgrst_source AS (SELECT 1)', [])).toBe(false)
    expect(isPlatformNoise('select public.ping_generation_worker()', [])).toBe(
      false,
    )
    expect(
      isPlatformNoise('select public.ping_generation_worker()', [
        'public.ping_',
      ]),
    ).toBe(true)
  })
  it('treats perf.ignore entries as plain substrings, never as patterns', () => {
    expect(isPlatformNoise('select 1', ['^select'])).toBe(false)
    expect(isPlatformNoise('select a.b(', ['a.b('])).toBe(true)
  })
})
