import { cteNames } from '@/adapters/sqlite/cteNames.js'
import type { ScannedTable } from '@/adapters/sqlite/ScannedTable.js'
import { scanOfPlanRow } from '@/adapters/sqlite/scanOfPlanRow.js'
import { statementTableAliases } from '@/adapters/sqlite/statementTableAliases.js'

// A CTE name wins over a table of the same name, as it does in SQLite, and
// an alias over both; a name that resolves to nothing real is not reported.
/** The real tables a statement's plan scans end to end. */
export const scannedTables = (
  statement: string,
  details: string[],
  tables: Map<string, string>,
): ScannedTable[] => {
  const ctes = cteNames(statement)
  const aliases = statementTableAliases(statement, tables)
  return details.flatMap((detail) => {
    const scan = scanOfPlanRow(detail)
    if (!scan) return []
    const name = scan.name.toLowerCase()
    if (ctes.has(name)) return []
    const table = aliases.get(name) ?? tables.get(name)
    return table === undefined
      ? []
      : [{ table, kind: scan.kind, detail: scan.detail }]
  })
}
