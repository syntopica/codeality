import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import type { PostgresScratch } from '@/adapters/kysely/PostgresScratch.js'
import { scratchFileName } from '@/adapters/kysely/scratchFileName.js'
import { splitSqlStatements } from '@/sql/splitSqlStatements.js'

/** One `.sql` file per migration with a PostgreSQL up, written into `directory`. */
export const writePostgresScratch = (
  directory: string,
  migrations: LocatedMigration[],
): PostgresScratch[] =>
  migrations.flatMap((migration) => {
    const compilation = migration.dialects.postgres
    if (!compilation || compilation.up.length === 0) return []
    const text = `${compilation.up.map((statement) => `${statement.sql};`).join('\n')}\n`
    const path = scratchFileName(migration.name)
    writeFileSync(join(directory, path), text)
    return [{ file: { path, statements: splitSqlStatements(text) }, migration }]
  })
