import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ConfigError } from '@syntopica/gate-kit/ConfigError'
import { readBaseline } from '@syntopica/gate-kit/readBaseline'
import { writeBaseline } from '@syntopica/gate-kit/writeBaseline'

describe('baseline file', () => {
  it('round-trips with sorted entries and a trailing newline', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeBaseline(root, BASELINE_FILENAME, {
      schemaVersion: 1,
      toolVersion: '0.1.0',
      entries: ['b', 'a'],
    })
    expect(
      readFileSync(join(root, '.codeality-db-baseline.json'), 'utf8'),
    ).toBe(
      '{\n  "schemaVersion": 1,\n  "toolVersion": "0.1.0",\n  "entries": [\n    "a",\n    "b"\n  ]\n}\n',
    )
    expect(
      readBaseline(root, BASELINE_FILENAME, 'codeality-db').entries,
    ).toEqual(['a', 'b'])
  })
  it('reports a missing baseline', () => {
    expect(() =>
      readBaseline(
        mkdtempSync(join(tmpdir(), 'dbq-')),
        BASELINE_FILENAME,
        'codeality-db',
      ),
    ).toThrow(ConfigError)
  })
  it('rejects a baseline of another version', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(
      join(root, '.codeality-db-baseline.json'),
      '{"schemaVersion":2,"entries":[]}',
    )
    expect(() => readBaseline(root, BASELINE_FILENAME, 'codeality-db')).toThrow(
      /not a version 1 baseline/,
    )
  })
})
