import type { ColumnTypeDrift } from '@/adapters/kysely/drift/ColumnTypeDrift.js'
import type { DriftFromDiagnosticOptions } from '@/adapters/kysely/drift/DriftFromDiagnosticOptions.js'
import { driftTypeFormatFlags } from '@/adapters/kysely/drift/driftTypeFormatFlags.js'
import { exportSymbol } from '@/adapters/kysely/drift/exportSymbol.js'
import { matchedDeclaredProperty } from '@/adapters/kysely/drift/matchedDeclaredProperty.js'
import { matchedSharedColumn } from '@/adapters/kysely/drift/matchedSharedColumn.js'

// Turns one semantic diagnostic from the check probe into a column-type-drift
// entry, reading the live and declared type strings off the paired
// `L<n>`/`D<n>` aliases for the column whose `C<n>` line it lands on.
export const driftFromDiagnostic = ({
  tsModule,
  diagnostic,
  sourceFile,
  program,
  declared,
  byIndex,
}: DriftFromDiagnosticOptions): ColumnTypeDrift => {
  if (diagnostic.start === undefined)
    throw new Error(
      `internal error building the Kysely type drift check probe: ${tsModule.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`,
    )
  const { line } = sourceFile.getLineAndCharacterOfPosition(diagnostic.start)
  const matched = matchedSharedColumn(sourceFile, line, byIndex)
  if (matched === undefined)
    throw new Error(
      `internal error building the Kysely type drift check probe: ${tsModule.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`,
    )
  const property = matchedDeclaredProperty(declared, matched)
  const checker = program.getTypeChecker()
  const liveSymbol = exportSymbol({
    checker,
    program,
    name: `L${String(matched.index)}`,
  })
  const declaredSymbol = exportSymbol({
    checker,
    program,
    name: `D${String(matched.index)}`,
  })
  const formatFlags = driftTypeFormatFlags(tsModule)
  return {
    table: matched.table,
    column: matched.column,
    property,
    liveType: checker.typeToString(
      checker.getDeclaredTypeOfSymbol(liveSymbol),
      undefined,
      formatFlags,
    ),
    declaredType: checker.typeToString(
      checker.getDeclaredTypeOfSymbol(declaredSymbol),
      undefined,
      formatFlags,
    ),
  }
}
