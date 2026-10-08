import type { ColumnTypeDrift } from '@/adapters/kysely/drift/ColumnTypeDrift.js'
import { compareTables } from '@/adapters/kysely/drift/compareTables.js'
import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { LiveSchema } from '@/adapters/kysely/drift/LiveSchema.js'
import type { SchemaComparison } from '@/adapters/kysely/drift/SchemaComparison.js'

// Pure comparison of the live schema against the hand-written one, so the
// five drift rules are testable without a database or the compiler API.
export const compareSchemas = (
  live: LiveSchema,
  declared: DeclaredSchema,
  ignores: string[],
  columnTypeDrift: ColumnTypeDrift[],
): SchemaComparison => ({
  ...compareTables(live, declared, ignores),
  columnTypeDrift,
})
