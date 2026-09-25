import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { checkCommand } from '@/commands/checkCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'

const ok: CommandRunner = () => ({
  status: 0,
  stdout: '[]',
  stderr: '',
  missing: false,
})
const supabaseProject = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
  writeFileSync(
    join(root, 'codeality-db.json'),
    '{"schemaVersion":1,"supabase":{"migrations":"supabase/migrations"}}',
  )
  return root
}

describe('checkCommand', () => {
  it('exits 2 without a configuration file', () => {
    const io = commandIoFor(mkdtempSync(join(tmpdir(), 'dbq-')), ok)
    expect(checkCommand([], io)).toBe(2)
    expect(io.err.join('')).toMatch(
      /configuration error: codeality-db.json not found/,
    )
  })
  it('exits 2 on an unknown flag', () => {
    const io = commandIoFor(supabaseProject(), ok)
    expect(checkCommand(['--nope'], io)).toBe(2)
  })
  it('exits 1 with findings and prints them', () => {
    const root = supabaseProject()
    writeFileSync(
      join(root, 'supabase/migrations/1.sql'),
      'create table public.t (id int);',
    )
    const io = commandIoFor(root, ok)
    expect(checkCommand([], io)).toBe(1)
    expect(io.out.join('')).toMatch(/BDB003/)
  })
  it('prints the legacy schemaVersion notice on stderr and still exits by findings', () => {
    const root = supabaseProject()
    writeFileSync(
      join(root, 'supabase/migrations/1.sql'),
      'create table public.t (id int);',
    )
    const io = commandIoFor(root, ok)
    expect(checkCommand([], io)).toBe(1)
    expect(io.err.join('')).toMatch(/schemaVersion 1.*init --apply/)
  })
  it('exits 3 when a required tool is missing', () => {
    const io = commandIoFor(supabaseProject(), () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    }))
    expect(checkCommand([], io)).toBe(3)
    expect(io.err.join('')).toMatch(/error: squawk is not installed/)
  })
  it('exits 0 and prints JSON when clean', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    const io = commandIoFor(root, ok)
    expect(checkCommand(['--json'], io)).toBe(0)
    expect(JSON.parse(io.out.join(''))).toEqual({
      schemaVersion: 1,
      findings: [],
    })
  })
})
