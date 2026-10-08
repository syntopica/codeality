import type { SharedColumn } from '@/adapters/kysely/drift/SharedColumn.js'
import type ts from 'typescript'

// Finds which shared column a diagnostic's line belongs to, by matching the
// `export type C<n>` marker the check probe wrote on that line.
export const matchedSharedColumn = (
  sourceFile: ts.SourceFile,
  line: number,
  sharedColumns: Map<number, SharedColumn>,
): SharedColumn | undefined => {
  const text = sourceFile.text.split('\n')[line] ?? ''
  return [...sharedColumns.values()].find((candidate) => {
    const marker = `C${String(candidate.index)} `
    return text.startsWith(`export type ${marker}`)
  })
}
