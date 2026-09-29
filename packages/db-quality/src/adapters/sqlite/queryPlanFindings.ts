import { attemptSqlite } from '@/adapters/sqlite/attemptSqlite.js'
import { fullScanMessage } from '@/adapters/sqlite/fullScanMessage.js'
import { queryPlan } from '@/adapters/sqlite/queryPlan.js'
import type { QueryPlanContext } from '@/adapters/sqlite/QueryPlanContext.js'
import { scannedTables } from '@/adapters/sqlite/scannedTables.js'
import { sqliteFinding } from '@/adapters/sqlite/sqliteFinding.js'
import { tableRowCount } from '@/adapters/sqlite/tableRowCount.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

// A statement sqlite3 cannot plan (an application-defined function, a module
// the shell lacks) is skipped: the check reports what it can prove.
/** BDB406: one finding per file, table and scan kind whose plan reads a large table end to end. */
export const queryPlanFindings = (
  context: QueryPlanContext,
  files: MigrationFile[],
): Finding[] => {
  if (isDisabled('BDB406', context.disabled)) return []
  const { runner, root, database } = context
  const counts = new Map<string, number>()
  const rowsOf = (table: string): number => {
    const known = counts.get(table)
    if (known !== undefined) return known
    const rows =
      attemptSqlite(() => tableRowCount(runner, root, database, table)) ?? 0
    counts.set(table, rows)
    return rows
  }
  return files.flatMap((file) => {
    const reported = new Set<string>()
    return file.statements.flatMap((statement) => {
      const details = attemptSqlite(() =>
        queryPlan(runner, root, database, statement.text),
      )
      if (!details) return []
      const sorts = details.includes('USE TEMP B-TREE FOR ORDER BY')
      return scannedTables(statement.text, details, context.tables).flatMap(
        (scan) => {
          const key = `${scan.table}:${scan.kind}`
          const rows = rowsOf(scan.table)
          if (reported.has(key) || rows < context.minRows) return []
          reported.add(key)
          return sqliteFinding(
            {
              code: 'BDB406',
              severity: 'warn',
              file: file.path,
              line: statement.line,
              subject: scan.table,
              message: fullScanMessage(scan, rows, sorts),
              context: key,
            },
            context.disabled,
          )
        },
      )
    })
  })
}
