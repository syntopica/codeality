import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { TablePresence } from '@/adapters/kysely/drift/TablePresence.js'

/** Parameters for comparing one declared table's columns against the live columns. */
export type ColumnPresenceForTableOptions = {
  table: string
  entry: NonNullable<ReturnType<DeclaredSchema['get']>>
  liveColumns: Set<string>
  columnMissingInType: TablePresence['columnMissingInType']
  columnMissingInDatabase: TablePresence['columnMissingInDatabase']
}
