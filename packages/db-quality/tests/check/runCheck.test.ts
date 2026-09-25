import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runCheck } from '@/check/runCheck.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const runner: CommandRunner = (command, args) => {
  if (command === 'sqlite3' && args.at(-1) === 'PRAGMA integrity_check') {
    return {
      status: 0,
      stdout: '[{"integrity_check":"ok"}]',
      stderr: '',
      missing: false,
    }
  }
  if (command === 'prisma-lint') {
    return {
      status: 1,
      stdout: '',
      stderr:
        '{"violations":[{"ruleName":"require-field-index","message":"Field \\"a\\" must have an index.","fileName":"prisma/schema.prisma","location":{"startLine":2}}]}',
      missing: false,
    }
  }
  return { status: 0, stdout: '[]', stderr: '', missing: false }
}

describe('runCheck', () => {
  it('runs every configured adapter and returns the sorted findings', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    writeFileSync(
      join(root, 'supabase/migrations/1.sql'),
      'create table public.t (id int);',
    )
    const config = configFromDocument({
      schemaVersion: 1,
      supabase: { migrations: 'supabase/migrations' },
      prisma: { schema: 'prisma/schema.prisma' },
      drizzle: { roots: ['src'] },
      sqlite: { files: ['a.db'] },
    })
    expect(runCheck({ root, config, runner }).map((f) => f.code)).toEqual([
      'BDB200/require-field-index',
      'BDB003',
    ])
  })
  it('does nothing with an empty configuration', () => {
    expect(
      runCheck({
        root: '/nowhere',
        config: configFromDocument({ schemaVersion: 1 }),
        runner,
      }),
    ).toEqual([])
  })
  it('runs the postgrest rules with an empty knowledge map when supabase is not configured', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(
      join(root, 'src/queries.ts'),
      "declare const supabase: { from: (t: string) => any }\nexport const listAll = () => supabase.from('orders').select('*')\n",
    )
    const config = configFromDocument({
      schemaVersion: 1,
      postgrest: { roots: ['src'] },
    })
    expect(runCheck({ root, config, runner }).map((f) => f.code)).toEqual([
      'BDB801',
    ])
  })
})
