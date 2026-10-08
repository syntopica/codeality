import type { SchemaComparison } from '@/adapters/kysely/drift/SchemaComparison.js'

/** Table- and column-presence parts of a schema comparison, before fingerprints apply. */
export type TablePresence = {
  tableMissingInType: string[]
  tableMissingInDatabase: SchemaComparison['tableMissingInDatabase']
  columnMissingInType: SchemaComparison['columnMissingInType']
  columnMissingInDatabase: SchemaComparison['columnMissingInDatabase']
}
