import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { initCommand } from '@/commands/initCommand.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'

const ioFor = (): ReturnType<typeof commandIoFor> =>
  commandIoFor(mkdtempSync(join(tmpdir(), 'dbq-')), () => ({
    status: 0,
    stdout: '',
    stderr: '',
    missing: false,
  }))

describe('initCommand', () => {
  it('plans by default, --check fails while work remains, --apply writes', () => {
    const io = ioFor()
    expect(initCommand([], io)).toBe(0)
    expect(io.out.join('')).toMatch(/create\s+codeality-db.json/)
    expect(initCommand(['--check'], io)).toBe(1)
    expect(initCommand(['--apply'], io)).toBe(0)
    expect(initCommand(['--check'], io)).toBe(0)
  })
  it('refuses to apply over a conflict without --force', () => {
    const io = ioFor()
    writeFileSync(join(io.root, 'codeality-db.json'), '{"schemaVersion":9}')
    expect(initCommand(['--apply'], io)).toBe(2)
    expect(io.err.join('')).toMatch(/conflicts remain/)
    expect(initCommand(['--force'], io)).toBe(0)
    expect(initCommand(['--bogus'], io)).toBe(2)
  })
})
