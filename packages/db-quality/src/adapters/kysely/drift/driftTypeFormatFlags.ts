import type { DriftTypeScript } from '@/adapters/kysely/drift/DriftTypeScript.js'
import type ts from 'typescript'

// Computes the type-format flags from the same `ts` module value the
// checker came from, so the flags share an enum type with the checker's
// `TypeFormatFlags` parameter.
export const driftTypeFormatFlags = (
  tsModule: DriftTypeScript,
): ts.TypeFormatFlags =>
  tsModule.TypeFormatFlags.InTypeAlias | tsModule.TypeFormatFlags.NoTruncation
