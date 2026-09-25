import { cpSync, mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runPrismaLint } from '@/adapters/prisma/runPrismaLint.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const installed = !spawnRunner('prisma-lint', ['--help'], {
  cwd: process.cwd(),
}).missing

describe.skipIf(!installed)('runPrismaLint with the real binary', () => {
  it('reports the relation field without an index', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'prisma'))
    cpSync(
      new URL('../../fixtures/prisma/schema.prisma', import.meta.url),
      join(root, 'prisma/schema.prisma'),
    )
    const findings = runPrismaLint(
      spawnRunner,
      root,
      'prisma/schema.prisma',
      [],
    )
    expect(findings.map((f) => [f.code, f.subject])).toEqual([
      ['BDB200/require-field-index', 'authorId'],
    ])
  })
})
