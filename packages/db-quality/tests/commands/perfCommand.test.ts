import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { perfCommand } from '@/commands/perfCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'

const config = '{"schemaVersion":2}'
const url = 'postgres://u:p@db.example.com/d'
const psql: CommandRunner = (_c, args) => {
  const sql = args.at(-1) ?? ''
  const stdout = sql.includes('_info')
    ? '[{"stats_reset":"r"}]'
    : sql.includes('pg_stat_user_tables')
      ? '[]'
      : sql.startsWith('explain')
        ? '[{"Plan":{"Node Type":"Result","Plan Rows":1,"Actual Rows":1,"Actual Loops":1},"Execution Time":0.5}]'
        : '[]'
  return { status: 0, stdout, stderr: '', missing: false }
}
const rootWith = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  writeFileSync(join(root, 'codeality-db.json'), config)
  return root
}

describe('perfCommand', () => {
  it('needs an action and a target', () => {
    const io = commandIoFor(rootWith(), psql)
    expect(perfCommand([], io)).toBe(2)
    expect(io.err.join('')).toMatch(
      /usage: codeality-db perf snapshot\|diff\|bench/,
    )
    const noTarget = commandIoFor(rootWith(), psql)
    expect(perfCommand(['snapshot'], noTarget)).toBe(2)
    expect(noTarget.err.join('')).toMatch(/--db-url/)
  })
  it('snapshot writes the file and diff reads it back', () => {
    const root = rootWith()
    const io = commandIoFor(root, psql)
    expect(perfCommand(['snapshot', '--db-url', url], io)).toBe(0)
    expect(existsSync(join(root, '.codeality-db-perf.json'))).toBe(true)
    expect(io.out.join('')).toMatch(
      /recorded 0 statements and 0 tables from db.example.com/,
    )
    const diff = commandIoFor(root, psql)
    expect(perfCommand(['diff', '--db-url', url, '--json'], diff)).toBe(0)
    expect(JSON.parse(diff.out.join(''))).toMatchObject({
      schemaVersion: 1,
      findings: [],
      improvements: [],
    })
  })
  it('bench records, then compares', () => {
    const root = rootWith()
    mkdirSync(join(root, 'db-quality/bench'), { recursive: true })
    writeFileSync(join(root, 'db-quality/bench/a.sql'), 'select 1;')
    expect(
      perfCommand(
        ['bench', '--record', '--db-url', url],
        commandIoFor(root, psql),
      ),
    ).toBe(0)
    expect(existsSync(join(root, '.codeality-db-bench.json'))).toBe(true)
    const io = commandIoFor(root, psql)
    expect(perfCommand(['bench', '--db-url', url], io)).toBe(0)
    expect(io.out.join('')).toMatch(/a\.sql/)
  })
  it('reports psql failures as infrastructure', () => {
    const failing: CommandRunner = () => ({
      status: 2,
      stdout: '',
      stderr: 'connection refused',
      missing: false,
    })
    const io = commandIoFor(rootWith(), failing)
    expect(perfCommand(['snapshot', '--db-url', url], io)).toBe(3)
    expect(io.err.join('')).toMatch(/psql failed: connection refused/)
  })
})
