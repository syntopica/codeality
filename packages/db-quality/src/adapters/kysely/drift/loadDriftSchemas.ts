import { declaredSchemaFromType } from '@/adapters/kysely/drift/declaredSchemaFromType.js'
import type { DriftSchemas } from '@/adapters/kysely/drift/DriftSchemas.js'
import type { DriftTypeScript } from '@/adapters/kysely/drift/DriftTypeScript.js'
import { liveSchemaFromType } from '@/adapters/kysely/drift/liveSchemaFromType.js'
import { programFromProbe } from '@/adapters/kysely/drift/programFromProbe.js'
import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'

// Builds a TypeScript program from the probe module and reads off the live
// and declared table/column shapes through the checker.
export const loadDriftSchemas = (
  ts: DriftTypeScript,
  root: string,
  probe: string,
  ref: DatabaseTypeRef,
): DriftSchemas => {
  const program = programFromProbe(ts, root, probe, ref)
  const sourceFile = program.getSourceFile(probe)
  if (sourceFile === undefined) throw new Error('probe module was not compiled')
  const checker = program.getTypeChecker()
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (moduleSymbol === undefined)
    throw new Error('probe module has no module symbol')
  const exportsOfModule = checker.getExportsOfModule(moduleSymbol)
  const liveSymbol = exportsOfModule.find((s) => s.name === 'Live')
  const declaredSymbol = exportsOfModule.find((s) => s.name === 'Declared')
  if (liveSymbol === undefined || declaredSymbol === undefined)
    throw new Error('probe module did not export Live and Declared')
  const liveType = checker.getDeclaredTypeOfSymbol(liveSymbol)
  const declaredType = checker.getDeclaredTypeOfSymbol(declaredSymbol)

  return {
    live: liveSchemaFromType(checker, liveType),
    declared: declaredSchemaFromType(ts, checker, declaredType),
    program,
  }
}
