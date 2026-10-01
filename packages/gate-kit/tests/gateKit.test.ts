import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { classifyFindings } from '../src/classifyFindings.js'
import { ConfigError } from '../src/ConfigError.js'
import { parseCommandArgs } from '../src/parseCommandArgs.js'
import { readBaseline } from '../src/readBaseline.js'
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
})
