import { describe, expect, it } from 'vitest'

import { kyselySquawkFindings } from '@/adapters/kysely/kyselySquawkFindings.js'
import { kyselySquawkExcludes } from '@/adapters/squawk/kyselySquawkExcludes.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { spawnRunner } from '@/tools/spawnRunner.js'
import { locatedFixture } from '@tests/adapters/kysely/locatedFixture.js'

const ROOT = new URL('../../..', import.meta.url).pathname
const PORTABLE = [
  'prefer-text-field',
  'ban-char-field',
  'prefer-timestamp-tz',
  'prefer-bigint-over-int',
]
const TABLE = locatedFixture('t', {
  postgres: [
    'create table if not exists "t" ("id" integer primary key, "code" char(2), "name" varchar(100), "at" timestamp)',
  ],
})
const rulesFor = (runner: CommandRunner, dialects: KyselyDialect[]): string[] =>
  kyselySquawkFindings(runner, ROOT, [TABLE], {
    excludes: kyselySquawkExcludes(dialects),
    disabled: [],
  })
    .map((finding) => finding.code)
    .sort()

describe('kyselySquawkExcludes', () => {
  it('keeps the PostgreSQL type advice for a PostgreSQL-only project', () => {
    const excludes = kyselySquawkExcludes(['postgres'])
    for (const rule of PORTABLE) expect(excludes).not.toContain(rule)
    expect(excludes).not.toContain('prefer-robust-stmts')
  })
  it('drops it when the migrations also target another dialect', () => {
    const excludes = kyselySquawkExcludes(['postgres', 'mysql'])
    for (const rule of PORTABLE) expect(excludes).toContain(rule)
    expect(excludes).not.toContain('prefer-robust-stmts')
  })
})

describe.skipIf(spawnRunner('squawk', ['--version'], { cwd: ROOT }).missing)(
  'kyselySquawkFindings',
  () => {
    it('reports the type advice on PostgreSQL alone, not on a portable schema', () => {
      const single = rulesFor(spawnRunner, ['postgres'])
      for (const rule of PORTABLE) expect(single).toContain(`BDB100/${rule}`)
      const portable = rulesFor(spawnRunner, ['postgres', 'mysql', 'sqlite'])
      for (const rule of PORTABLE)
        expect(portable).not.toContain(`BDB100/${rule}`)
    })
  },
)
