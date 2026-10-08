import type { ColumnPresenceForTableOptions } from '@/adapters/kysely/drift/ColumnPresenceForTableOptions.js'

// Compares one declared table's columns against the live columns for that
// same table, appending any mismatches to the shared accumulator arrays.
export const columnPresenceForTable = ({
  table,
  entry,
  liveColumns,
  columnMissingInType,
  columnMissingInDatabase,
}: ColumnPresenceForTableOptions): void => {
  for (const column of liveColumns) {
    if (!entry.columns.has(column))
      columnMissingInType.push({ table, column, property: entry.property })
  }
  for (const [column, property] of entry.columns) {
    if (!liveColumns.has(column))
      columnMissingInDatabase.push({ table, column, property })
  }
}
