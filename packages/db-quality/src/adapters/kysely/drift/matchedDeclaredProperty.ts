import type { DeclaredProperty } from '@/adapters/kysely/drift/DeclaredProperty.js'
import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { SharedColumn } from '@/adapters/kysely/drift/SharedColumn.js'

// Looks up the declared location for the matched shared column, throwing an
// internal error if the check probe somehow referenced a column that is not
// in the declared schema.
export const matchedDeclaredProperty = (
  declared: DeclaredSchema,
  matched: SharedColumn,
): DeclaredProperty => {
  const entry = declared.get(matched.table)
  const property = entry?.columns.get(matched.column)
  if (property === undefined)
    throw new Error(
      `internal error: no declared location for ${matched.table}.${matched.column}`,
    )
  return property
}
