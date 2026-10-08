import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { DriftTypeScript } from '@/adapters/kysely/drift/DriftTypeScript.js'
import type { SharedColumn } from '@/adapters/kysely/drift/SharedColumn.js'
import type ts from 'typescript'

/** Parameters for turning one semantic diagnostic into a column-type-drift entry. */
export type DriftFromDiagnosticOptions = {
  tsModule: DriftTypeScript
  diagnostic: ts.Diagnostic
  sourceFile: ts.SourceFile
  program: ts.Program
  declared: DeclaredSchema
  byIndex: Map<number, SharedColumn>
}
