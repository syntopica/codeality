import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runDrizzleLint } from '@/adapters/drizzle/runDrizzleLint.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const installed = !spawnRunner('eslint', ['--version'], { cwd: process.cwd() })
  .missing

describe.skipIf(!installed)('runDrizzleLint with the real eslint', () => {
  it('flags delete and update without where, and accepts a guarded delete', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'src'))
    writeFileSync(
      join(root, 'src/repo.ts'),
      'declare const db: any\ndb.delete(1)\ndb.update(1).set({})\ndb.delete(1).where(true)\n',
    )
    // The package's own node_modules hold the peers; eslint resolves the
    // config's imports from the asset location, not from the temp root.
    const findings = runDrizzleLint(
      spawnRunner,
      root,
      { roots: ['src'], objectNames: ['db', 'tx'] },
      [],
    )
    expect(findings.map((f) => [f.code, f.line])).toEqual([
      ['BDB300/enforce-delete-with-where', 2],
      ['BDB300/enforce-update-with-where', 3],
    ])
  })
})
