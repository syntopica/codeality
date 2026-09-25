import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readMigrationSet } from '@/sql/readMigrationSet.js'

describe('readMigrationSet', () => {
  it('reads every .sql file in name order with root-relative POSIX paths', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    writeFileSync(join(root, 'supabase/migrations/2_b.sql'), 'select 2;')
    writeFileSync(join(root, 'supabase/migrations/1_a.sql'), 'select 1;')
    writeFileSync(join(root, 'supabase/migrations/notes.md'), 'x')
    const set = readMigrationSet(root, 'supabase/migrations')
    expect(set.map((file) => file.path)).toEqual([
      'supabase/migrations/1_a.sql',
      'supabase/migrations/2_b.sql',
    ])
    expect(set[0]?.statements).toEqual([{ text: 'select 1', line: 1 }])
  })
})
