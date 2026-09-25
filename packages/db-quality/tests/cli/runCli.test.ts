import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'

const ioFor = (root: string): ReturnType<typeof commandIoFor> =>
  commandIoFor(root, () => ({
    status: 0,
    stdout: '[]',
    stderr: '',
    missing: false,
  }))

describe('runCli', () => {
  it('answers --version and --help, and prints the usage on a bad command', () => {
    const io = ioFor('/nowhere')
    expect(runCli(['--version'], io)).toBe(0)
    expect(io.out[0]).toMatch(/^codeality-db \d+\.\d+\.\d+\n$/)
    expect(runCli(['--help'], io)).toBe(0)
    expect(runCli(['-h'], io)).toBe(0)
    expect(io.out[1]).toMatch(/init.*check.*audit.*gate.*baseline.*perf/s)
    expect(runCli([], io)).toBe(2)
    expect(runCli(['nope'], io)).toBe(2)
    expect(io.err.join('')).toMatch(/usage: codeality-db/)
  })
  it('runs a command against --project instead of the cwd', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    const io = ioFor('/nowhere')
    expect(runCli(['--project', root, 'check', '--json'], io)).toBe(0)
    expect(JSON.parse(io.out.join(''))).toEqual({
      schemaVersion: 1,
      findings: [],
    })
    expect(runCli(['--project'], io)).toBe(2)
  })
})
