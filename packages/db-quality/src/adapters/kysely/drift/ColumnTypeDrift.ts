import type { DeclaredProperty } from '@/adapters/kysely/drift/DeclaredProperty.js'

/** A shared column whose live SELECT type does not satisfy the declared one. */
export type ColumnTypeDrift = {
  table: string
  column: string
  property: DeclaredProperty
  liveType: string
  declaredType: string
}
