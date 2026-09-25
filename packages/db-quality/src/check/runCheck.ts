import { runDrizzleLint } from '@/adapters/drizzle/runDrizzleLint.js'
import { runPrismaLint } from '@/adapters/prisma/runPrismaLint.js'
import { runSqliteChecks } from '@/adapters/sqlite/runSqliteChecks.js'
import { runSquawk } from '@/adapters/squawk/runSquawk.js'
import type { CheckContext } from '@/check/CheckContext.js'
import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'
import { runPostgrestRules } from '@/postgrest/runPostgrestRules.js'
import { indexedColumns } from '@/rules/indexedColumns.js'
import { runSqlRules } from '@/rules/runSqlRules.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import { readMigrationSet } from '@/sql/readMigrationSet.js'

/** Every static adapter the configuration enables, in one sorted list. Errors propagate. */
export const runCheck = ({ root, config, runner }: CheckContext): Finding[] => {
  const findings: Finding[] = []
  const set: MigrationFile[] = config.supabase
    ? readMigrationSet(root, config.supabase.migrations)
    : []
  if (config.supabase) {
    findings.push(
      ...runSqlRules(set, config.disable),
      ...runSquawk(runner, root, set, config.disable),
    )
  }
  if (config.prisma) {
    findings.push(
      ...runPrismaLint(runner, root, config.prisma.schema, config.disable),
    )
  }
  if (config.drizzle)
    findings.push(
      ...runDrizzleLint(runner, root, config.drizzle, config.disable),
    )
  if (config.sqlite) {
    findings.push(
      ...runSqliteChecks(runner, root, config.sqlite.files, config.disable),
    )
  }
  if (config.postgrest) {
    findings.push(
      ...runPostgrestRules(
        root,
        config.postgrest.roots,
        indexedColumns(set),
        config.disable,
      ),
    )
  }
  return findings.sort(compareFindings)
}
