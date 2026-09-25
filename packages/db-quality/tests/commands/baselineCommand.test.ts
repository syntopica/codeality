import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { baselineCommand } from '@/commands/baselineCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'

const ok: CommandRunner = () => ({
  status: 0,
  stdout: '[]',
  stderr: '',
  missing: false,
})
const project = (sql: string): ReturnType<typeof commandIoFor> => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
  writeFileSync(join(root, 'supabase/migrations/1.sql'), sql)
  writeFileSync(
    join(root, 'codeality-db.json'),
    '{"schemaVersion":1,"supabase":{"migrations":"supabase/migrations"}}',
  )
  return commandIoFor(root, ok)
}

describe('baselineCommand', () => {
  it('create records the debt, check then passes, a new finding fails', () => {
    const io = project('create table public.t (id int);')
    expect(baselineCommand(['create'], io)).toBe(0)
    expect(existsSync(join(io.root, '.codeality-db-baseline.json'))).toBe(true)
    expect(baselineCommand(['check'], io)).toBe(0)
    writeFileSync(
      join(io.root, 'supabase/migrations/2.sql'),
      'create table public.u (id int);',
    )
    expect(baselineCommand(['check'], io)).toBe(1)
    expect(io.out.join('')).toMatch(/1 new, 1 known, 0 resolved/)
  })
  it('create refuses to overwrite, update does not', () => {
    const io = project('select 1;')
    expect(baselineCommand(['create'], io)).toBe(0)
    expect(baselineCommand(['create'], io)).toBe(2)
    expect(io.err.join('')).toMatch(/exists; use "baseline update"/)
    expect(baselineCommand(['update'], io)).toBe(0)
  })
  it('check --check-stale fails on resolved debt', () => {
    const io = project('create table public.t (id int);')
    baselineCommand(['create'], io)
    writeFileSync(join(io.root, 'supabase/migrations/1.sql'), 'select 1;')
    expect(baselineCommand(['check'], io)).toBe(0)
    expect(baselineCommand(['check', '--check-stale'], io)).toBe(1)
  })
  it('needs a subcommand and a baseline to check against', () => {
    const io = project('select 1;')
    expect(baselineCommand([], io)).toBe(2)
    expect(baselineCommand(['check'], io)).toBe(2)
    expect(io.err.join('')).toMatch(/usage: codeality-db baseline/)
    expect(io.err.join('')).toMatch(/baseline create/)
  })
})
