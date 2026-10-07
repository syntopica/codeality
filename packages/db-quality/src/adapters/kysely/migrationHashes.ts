import { compilationHash } from '@/adapters/kysely/compilationHash.js'
import type { CompiledMigration } from '@/adapters/kysely/CompiledMigration.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'

/** One hash per dialect the migration was compiled on. */
export const migrationHashes = (
  migration: CompiledMigration,
): Partial<Record<KyselyDialect, string>> =>
  Object.fromEntries(
    Object.entries(migration.dialects).map(([dialect, compilation]) => [
      dialect,
      compilationHash(compilation),
    ]),
  )
