import { probeQueryDatabase } from '@/adapters/sqlite/probeQueryDatabase.js'
import { queryPlanFindings } from '@/adapters/sqlite/queryPlanFindings.js'
import { readQueryFiles } from '@/adapters/sqlite/readQueryFiles.js'
import { SQLITE_QUERY_RULES } from '@/adapters/sqlite/SQLITE_QUERY_RULES.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { SqliteQueriesConfig } from '@/config/SqliteQueriesConfig.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** BDB404-BDB406 on the query files; the plan check only when the database is readable. */
export const runSqliteQueryChecks = (
  runner: CommandRunner,
  root: string,
  queries: SqliteQueriesConfig,
  disabled: DisableEntry[],
): Finding[] => {
  const files = readQueryFiles(root, queries.paths)
  const findings = SQLITE_QUERY_RULES.filter(
    (rule) => !isDisabled(rule.code, disabled),
  ).flatMap((rule) => rule.run(files))
  if (queries.database === undefined) return findings
  const probe = probeQueryDatabase(runner, root, queries.database)
  if ('unavailable' in probe) return findings
  return [
    ...findings,
    ...queryPlanFindings(
      {
        runner,
        root,
        database: probe.path,
        tables: probe.tables,
        minRows: queries.minRows,
        disabled,
      },
      files,
    ),
  ]
}
