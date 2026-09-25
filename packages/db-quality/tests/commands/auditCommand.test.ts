import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { auditCommand } from '@/commands/auditCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'

const denied: CommandRunner = () => ({
  status: 1,
  stdout: '{"_tag":"Error","error":{"code":"X","message":"status 403"}}',
  stderr: '',
  missing: false,
})
const clean: CommandRunner = (_c, args) => ({
  status: 0,
  stdout: args[0] === 'db' ? '{"results":[]}' : '{"rows":[]}',
  stderr: '',
  missing: false,
})

describe('auditCommand', () => {
  it('exits 2 without a target and 3 on an auth failure', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    const io = commandIoFor(root, denied)
    expect(auditCommand([], io)).toBe(2)
    expect(auditCommand(['--db-url', 'postgres://u:p@h/d'], io)).toBe(3)
    expect(io.err.join('')).toMatch(/403/)
  })
  it('exits 3 when Soda produces no results, and 2 when --linked has no link', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(
      join(root, 'codeality-db.json'),
      '{"schemaVersion":1,"audit":{"soda":"soda"}}',
    )
    const io = commandIoFor(root, clean)
    expect(auditCommand(['--json', '--db-url', 'postgres://u:p@h/d'], io)).toBe(
      3,
    )
    expect(io.err.join('')).toMatch(/soda scan produced no results/)
    const linkedIo = commandIoFor(root, clean)
    expect(auditCommand(['--linked'], linkedIo)).toBe(2)
    expect(linkedIo.err.join('')).toMatch(/not linked/)
  })
  it('exits 0 on a clean linked project and says when Soda was skipped', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(
      join(root, 'codeality-db.json'),
      '{"schemaVersion":1,"audit":{"soda":"soda"}}',
    )
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(join(root, 'supabase/.temp/project-ref'), 'abc')
    const io = commandIoFor(root, clean)
    expect(auditCommand(['--linked', '--json'], io)).toBe(0)
    expect(io.err.join('')).toMatch(/soda: skipped/)
    expect(JSON.parse(io.out.join(''))).toEqual({
      schemaVersion: 1,
      findings: [],
    })
  })
})
