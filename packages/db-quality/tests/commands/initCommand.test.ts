import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
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
  it('detects a Supabase project, writes postgrest.roots and the bench README, and shows the adoption phase', () => {
    const io = ioFor()
    mkdirSync(join(io.root, 'src'), { recursive: true })
    writeFileSync(
      join(io.root, 'package.json'),
      JSON.stringify({ dependencies: { '@supabase/supabase-js': '^2.0.0' } }),
    )
    expect(initCommand(['--apply'], io)).toBe(0)
    const config = JSON.parse(
      readFileSync(join(io.root, 'codeality-db.json'), 'utf8'),
    ) as { postgrest?: { roots: string[] } }
    expect(config.postgrest?.roots).toContain('src')
    expect(existsSync(join(io.root, 'db-quality/bench/README.md'))).toBe(true)
    expect(io.out.join('')).toMatch(/adoption phase 1 of 4/)
  })
  it('--check fails on a valid schemaVersion 1 file, offering the upgrade', () => {
    const io = ioFor()
    writeFileSync(join(io.root, 'codeality-db.json'), '{"schemaVersion":1}')
    expect(initCommand(['--check'], io)).not.toBe(0)
    expect(io.out.join('')).toMatch(
      /merge\s+codeality-db.json\s+upgraded to schemaVersion 2/,
    )
  })
})
