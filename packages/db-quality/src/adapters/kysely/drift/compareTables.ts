import { columnPresenceForTable } from '@/adapters/kysely/drift/columnPresenceForTable.js'
import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { LiveSchema } from '@/adapters/kysely/drift/LiveSchema.js'
import { tableMissingInType } from '@/adapters/kysely/drift/tableMissingInType.js'
import type { TablePresence } from '@/adapters/kysely/drift/TablePresence.js'

// Compares live and declared tables and columns, independent of column type
// drift, so `compareSchemas` stays within the cognitive complexity budget.
export const compareTables = (
  live: LiveSchema,
  declared: DeclaredSchema,
  ignores: string[],
): TablePresence => {
  const tableMissingInDatabase: TablePresence['tableMissingInDatabase'] = []
  const columnMissingInType: TablePresence['columnMissingInType'] = []
  const columnMissingInDatabase: TablePresence['columnMissingInDatabase'] = []

  for (const [table, entry] of declared) {
    const liveColumns = live.get(table)
    if (liveColumns === undefined) {
      tableMissingInDatabase.push({ table, property: entry.property })
      continue
    }
    columnPresenceForTable({
      table,
      entry,
      liveColumns,
      columnMissingInType,
      columnMissingInDatabase,
    })
  }

  return {
    tableMissingInType: tableMissingInType(live, declared, ignores),
    tableMissingInDatabase,
    columnMissingInType,
    columnMissingInDatabase,
  }
}
