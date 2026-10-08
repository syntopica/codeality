import { join } from 'node:path'

import type { ExportSymbolOptions } from '@/adapters/kysely/drift/ExportSymbolOptions.js'
import type ts from 'typescript'

// Looks up a named export of the compiled check probe module, so the caller
// can read its declared type off the checker.
export const exportSymbol = ({
  checker,
  program,
  name,
}: ExportSymbolOptions): ts.Symbol => {
  const checkFile = program
    .getSourceFiles()
    .find((file) => file.fileName.endsWith(join('check.ts')))
  if (checkFile === undefined) throw new Error('check probe is missing')
  const moduleSymbol = checker.getSymbolAtLocation(checkFile)
  if (moduleSymbol === undefined)
    throw new Error('check probe has no module symbol')
  const symbol = checker
    .getExportsOfModule(moduleSymbol)
    .find((candidate) => candidate.name === name)
  if (symbol === undefined)
    throw new Error(`check probe did not export ${name}`)
  return symbol
}
