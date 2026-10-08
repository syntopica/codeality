import type { ColumnTypeDrift } from '@/adapters/kysely/drift/ColumnTypeDrift.js'
import type { DeclaredProperty } from '@/adapters/kysely/drift/DeclaredProperty.js'

/** Every kind of drift `compareSchemas` finds, before fingerprints and the disable list are applied. */
export type SchemaComparison = {
  tableMissingInType: string[]
  tableMissingInDatabase: { table: string; property: DeclaredProperty }[]
  columnMissingInType: {
    table: string
    column: string
    property: DeclaredProperty
  }[]
  columnMissingInDatabase: {
    table: string
    column: string
    property: DeclaredProperty
  }[]
  columnTypeDrift: ColumnTypeDrift[]
}
