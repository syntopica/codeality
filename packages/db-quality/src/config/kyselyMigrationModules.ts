import { sourceFilesUnder } from '@/postgrest/sourceFilesUnder.js'

/** Every `migrations/index.ts` or `migrations/migrationList.ts` under the roots, root-relative. */
export const kyselyMigrationModules = (
  root: string,
  roots: string[],
): string[] =>
  sourceFilesUnder(root, roots)
    .map((file) => file.replaceAll('\\', '/'))
    .filter((file) =>
      /(?:^|\/)migrations\/(?:index|migrationList)\.ts$/.test(file),
    )
