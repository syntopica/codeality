import type { ColumnTypeDrift } from '@/adapters/kysely/drift/ColumnTypeDrift.js'
import { driftFromDiagnostic } from '@/adapters/kysely/drift/driftFromDiagnostic.js'
import type { FindColumnTypeDriftsOptions } from '@/adapters/kysely/drift/FindColumnTypeDriftsOptions.js'
import type { SharedColumn } from '@/adapters/kysely/drift/SharedColumn.js'
import { writeDriftCheckProbe } from '@/adapters/kysely/drift/writeDriftCheckProbe.js'

// Compiles the check probe alongside the schema probe and turns every
// diagnostic that lands on a `C<n>` line into a column-type-drift entry.
// Any other diagnostic in check.ts means this adapter built an invalid
// probe, which is a bug here, not in the project under audit.
export const findColumnTypeDrifts = ({
  ts,
  probe,
  scratch,
  live,
  declared,
  baseOptions,
}: FindColumnTypeDriftsOptions): ColumnTypeDrift[] => {
  const { checkFile, sharedColumns } = writeDriftCheckProbe({
    scratch,
    live,
    declared,
  })
  const program = ts.createProgram({
    rootNames: [probe, checkFile],
    options: baseOptions,
  })
  const sourceFile = program.getSourceFile(checkFile)
  if (sourceFile === undefined) throw new Error('check probe was not compiled')
  const byIndex = new Map<number, SharedColumn>(
    sharedColumns.map((c) => [c.index, c]),
  )
  const drifts: ColumnTypeDrift[] = []
  for (const diagnostic of program.getSemanticDiagnostics(sourceFile)) {
    drifts.push(
      driftFromDiagnostic({
        tsModule: ts,
        diagnostic,
        sourceFile,
        program,
        declared,
        byIndex,
      }),
    )
  }
  return drifts
}
