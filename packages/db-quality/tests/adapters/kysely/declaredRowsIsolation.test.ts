import { describe, expect, it } from 'vitest'

import { compileKyselyMigrations } from '@/adapters/kysely/compileKyselyMigrations.js'
import { kyselyTempProject } from '@tests/adapters/kysely/kyselyTempProject.js'

describe('compileKyselyMigrations declared rows', () => {
  it('answers every query its own copy of the declared rows', async () => {
    const root = kyselyTempProject({
      'm.ts': `import { sql, type Kysely } from 'kysely'
const consume = async (db: Kysely<any>, statement: string) => {
  const { rows } = await sql<{ data_type: string }>\`select data_type from information_schema.columns\`.execute(db)
  const row = rows.pop()
  if (row?.data_type !== 'timestamp') return
  row.data_type = 'consumed'
  await sql.raw(statement).execute(db)
}
const both = (statement: string) => async (db: Kysely<any>) => {
  await consume(db, statement + ' 1')
  await consume(db, statement + ' 2')
}
export const migrations = {
  widen: { up: both('alter table t up'), down: both('alter table t down') },
}`,
    })
    const [widen] = await compileKyselyMigrations({
      root,
      module: 'm.ts',
      export: 'migrations',
      dialects: ['mysql', 'postgres'],
      queryResponses: [
        {
          match: 'information_schema.columns',
          rows: [{ data_type: 'timestamp' }],
        },
      ],
    })
    const altered = (statements: unknown) =>
      (statements as { sql: string }[])
        .map((statement) => statement.sql)
        .filter((statement) => statement.startsWith('alter'))
    for (const dialect of ['mysql', 'postgres'] as const) {
      const compiled = widen?.dialects[dialect]
      expect(compiled?.error).toBeUndefined()
      expect(altered(compiled?.up)).toEqual([
        'alter table t up 1',
        'alter table t up 2',
      ])
      expect(altered(compiled?.down)).toEqual([
        'alter table t down 1',
        'alter table t down 2',
      ])
    }
  })
})
