import type ts from 'typescript'

/** Parameters for looking up a named export's symbol on the compiled check probe. */
export type ExportSymbolOptions = {
  checker: ts.TypeChecker
  program: ts.Program
  name: string
}
