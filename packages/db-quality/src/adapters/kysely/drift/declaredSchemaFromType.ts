import type { DeclaredProperty } from '@/adapters/kysely/drift/DeclaredProperty.js'
import { declaredPropertyOf } from '@/adapters/kysely/drift/declaredPropertyOf.js'
import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { DriftTypeScript } from '@/adapters/kysely/drift/DriftTypeScript.js'
import type ts from 'typescript'

// Reads the hand-written type's shape off the checker: each table to its own
// location and its columns' locations.
export const declaredSchemaFromType = (
  tsModule: DriftTypeScript,
  checker: ts.TypeChecker,
  declaredType: ts.Type,
): DeclaredSchema => {
  const declared: DeclaredSchema = new Map()
  for (const tableSymbol of checker.getPropertiesOfType(declaredType)) {
    const declaration =
      tableSymbol.valueDeclaration ?? tableSymbol.declarations?.[0]
    if (declaration === undefined)
      throw new Error(`declared table "${tableSymbol.name}" has no declaration`)
    const property = declaredPropertyOf(tsModule, declaration)
    const tableType = checker.getTypeOfSymbol(tableSymbol)
    const columns = new Map<string, DeclaredProperty>()
    for (const columnSymbol of checker.getPropertiesOfType(tableType)) {
      const columnDeclaration =
        columnSymbol.valueDeclaration ?? columnSymbol.declarations?.[0]
      if (columnDeclaration === undefined)
        throw new Error(
          `declared column "${tableSymbol.name}.${columnSymbol.name}" has no declaration`,
        )
      columns.set(
        columnSymbol.name,
        declaredPropertyOf(tsModule, columnDeclaration),
      )
    }
    declared.set(tableSymbol.name, { property, columns })
  }
  return declared
}
