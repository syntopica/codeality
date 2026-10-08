import type { DeclaredProperty } from '@/adapters/kysely/drift/DeclaredProperty.js'
import type { DriftTypeScript } from '@/adapters/kysely/drift/DriftTypeScript.js'
import type ts from 'typescript'

// Where a declared table or column property is written, for the finding's
// path and line.
export const declaredPropertyOf = (
  ts: DriftTypeScript,
  declaration: ts.Declaration,
): DeclaredProperty => {
  const sourceFile = declaration.getSourceFile()
  const { line } = sourceFile.getLineAndCharacterOfPosition(
    declaration.getStart(),
  )
  return { path: sourceFile.fileName, line: line + 1 }
}
