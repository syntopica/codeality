import type { LiveSchema } from '@/adapters/kysely/drift/LiveSchema.js'
import type ts from 'typescript'

// Reads the live database's shape off the checker: each table name to its
// column names.
export const liveSchemaFromType = (
  checker: ts.TypeChecker,
  liveType: ts.Type,
): LiveSchema => {
  const live: LiveSchema = new Map()
  for (const tableSymbol of checker.getPropertiesOfType(liveType)) {
    const tableType = checker.getTypeOfSymbol(tableSymbol)
    const columns = new Set(
      checker.getPropertiesOfType(tableType).map((c) => c.name),
    )
    live.set(tableSymbol.name, columns)
  }
  return live
}
