import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runSquawk } from '@/adapters/squawk/runSquawk.js'
import { readMigrationSet } from '@/sql/readMigrationSet.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const installed = !spawnRunner('squawk', ['--version'], { cwd: process.cwd() })
  .missing

describe.skipIf(!installed)('runSquawk with the real binary', () => {
  it('reports prefer-bigint-over-int on an int primary key', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'm'))
    writeFileSync(join(root, 'm/1.sql'), 'create table t (id int primary key);')
    const findings = runSquawk(
      spawnRunner,
      root,
      readMigrationSet(root, 'm'),
      [],
    )
    expect(findings.map((f) => f.code)).toContain(
      'BDB100/prefer-bigint-over-int',
    )
  })
})
