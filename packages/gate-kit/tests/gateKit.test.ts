import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { classifyFindings } from '../src/classifyFindings.js'
import { cliTestAliases } from '../src/cliTestAliases.js'
import { cliTsupOptions } from '../src/cliTsupOptions.js'
import { ConfigError } from '../src/ConfigError.js'
import { parseCommandArgs } from '../src/parseCommandArgs.js'
import { readBaseline } from '../src/readBaseline.js'
import { readCliInvocation } from '../src/readCliInvocation.js'
import { reportCommandError } from '../src/reportCommandError.js'
import { writeBaseline } from '../src/writeBaseline.js'

describe('gate-kit', () => {
  it('writes, reads and classifies a baseline', () => {
    const root = mkdtempSync(join(tmpdir(), 'kit-'))
    expect(() => readBaseline(root, 'b.json', 'tool')).toThrow(
      'run "tool baseline create"',
    )
    writeBaseline(root, 'b.json', {
      schemaVersion: 1,
      toolVersion: '1',
      entries: ['b', 'a'],
    })
    const baseline = readBaseline(root, 'b.json', 'tool')
    expect(baseline.entries).toEqual(['a', 'b'])
    const classified = classifyFindings(
      [{ fingerprint: 'a' }, { fingerprint: 'c' }],
      baseline,
    )
    expect(classified).toEqual({
      new: [{ fingerprint: 'c' }],
      known: [{ fingerprint: 'a' }],
      resolved: ['b'],
    })
    writeFileSync(join(root, 'b.json'), '{"schemaVersion":2}')
    expect(() => readBaseline(root, 'b.json', 'tool')).toThrow(
      'not a version 1 baseline',
    )
    writeFileSync(join(root, 'c.json'), '{"schemaVersion":1,"entries":[]}')
    expect(readBaseline(root, 'c.json', 'tool').toolVersion).toBe('')
  })
  it('parses arguments and maps errors to exit codes', () => {
    expect(
      parseCommandArgs(['--json', 'x'], { json: { type: 'boolean' } }),
    ).toEqual({ values: { json: true }, positionals: ['x'] })
    expect(() => parseCommandArgs(['--nope'], {})).toThrow(ConfigError)
    const lines: string[] = []
    expect(
      reportCommandError(new ConfigError('bad'), (text) => lines.push(text)),
    ).toBe(2)
    expect(
      reportCommandError(new Error('boom'), (text) => lines.push(text)),
    ).toBe(3)
    expect(reportCommandError('raw', (text) => lines.push(text))).toBe(3)
    expect(lines).toEqual([
      'configuration error: bad\n',
      'error: boom\n',
      'error: raw\n',
    ])
  })
  it('reads the flags every gate CLI shares', () => {
    expect(readCliInvocation(['x', '--version'], '/cwd')).toEqual({
      kind: 'version',
    })
    expect(readCliInvocation(['-h'], '/cwd')).toEqual({ kind: 'help' })
    expect(readCliInvocation(['check', '--json'], '/cwd')).toEqual({
      kind: 'command',
      root: '/cwd',
      command: 'check',
      rest: ['--json'],
    })
    expect(readCliInvocation(['--project', '/p', 'check'], '/cwd')).toEqual({
      kind: 'command',
      root: '/p',
      command: 'check',
      rest: [],
    })
    expect(readCliInvocation(['--project'], '/cwd')).toEqual({
      kind: 'command',
      root: '',
      command: undefined,
      rest: [],
    })
  })
  it('builds the bundle options and test aliases of a gate CLI', () => {
    const options = cliTsupOptions('/pkg')
    const esbuild: { alias?: Record<string, string> } = {}
    options.esbuildOptions(esbuild)
    expect(esbuild.alias).toEqual({ '@': '/pkg/src' })
    const [tests, source] = cliTestAliases('/pkg')
    expect(
      '@tests/a/b.js'.replace(tests?.find ?? '', tests?.replacement ?? ''),
    ).toBe('/pkg/tests/a/b.ts')
    expect(
      '@/a.js'.replace(source?.find ?? '', source?.replacement ?? ''),
    ).toBe('/pkg/src/a.ts')
  })
})
