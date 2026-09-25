import { sourceFilesUnder } from '@/postgrest/sourceFilesUnder.js'

/** True when root/name holds at least one TypeScript source sourceFilesUnder would scan. */
export const hasPostgrestSources = (root: string, name: string): boolean =>
  sourceFilesUnder(root, [name]).length > 0
