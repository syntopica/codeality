import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { LiveSchema } from '@/adapters/kysely/drift/LiveSchema.js'

// Tables present in the live database but not declared in the hand-written
// type, excluding any explicitly ignored tables.
export const tableMissingInType = (
  live: LiveSchema,
  declared: DeclaredSchema,
  ignores: string[],
): string[] => {
  const result: string[] = []
  for (const table of live.keys()) {
    if (declared.has(table) || ignores.includes(table)) continue
    result.push(table)
  }
  return result
}
