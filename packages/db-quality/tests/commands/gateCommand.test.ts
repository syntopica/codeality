import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { gateCommand } from '@/commands/gateCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'

describe('gateCommand', () => {
  it('returns 3 when a linked audit cannot authenticate, even with a clean check', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(join(root, 'supabase/.temp/project-ref'), 'abc')
    const denied: CommandRunner = () => ({
      status: 1,
      stdout: '{"_tag":"Error","error":{"code":"X","message":"status 401"}}',
      stderr: '',
      missing: false,
    })
    const io = commandIoFor(root, denied)
    expect(gateCommand([], io)).toBe(3)
    expect(io.out.join('')).toMatch(/failed-to-run\s+audit/)
  })
  it('returns 0 for an unlinked clean project and prints JSON on request', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    const io = commandIoFor(root, () => ({
      status: 0,
      stdout: '',
      stderr: '',
      missing: false,
    }))
    expect(gateCommand(['--json'], io)).toBe(0)
    const report = JSON.parse(io.out.join('')) as {
      stages: { name: string; status: string }[]
    }
    expect(report.stages.map((s) => [s.name, s.status])).toEqual([
      ['check', 'passed'],
      ['audit', 'skipped-not-applicable'],
      ['perf', 'skipped-not-applicable'],
    ])
  })
  it('returns 2 without a configuration', () => {
    const io = commandIoFor(mkdtempSync(join(tmpdir(), 'dbq-')), () => ({
      status: 0,
      stdout: '',
      stderr: '',
      missing: false,
    }))
    expect(gateCommand([], io)).toBe(2)
  })
})
