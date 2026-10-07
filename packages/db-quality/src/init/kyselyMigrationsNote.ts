import type { StackSections } from '@/config/StackSections.js'

/** What init says when it detected Kysely but could not tell which file holds the migrations. */
export const kyselyMigrationsNote = (stacks: StackSections): string =>
  stacks.kysely && !stacks.kysely.migrations
    ? '; kysely.migrations left out: no single migrations/index.ts or migrations/migrationList.ts under the roots, set "module" or "folder" by hand'
    : ''
