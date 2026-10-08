import type { KyselyMigrationsConfig } from '@/config/KyselyMigrationsConfig.js'

/**
 * `databaseType` points at the hand-written Kysely `Database` type as
 * "<root-relative module path>#<export name>" (export name defaults to
 * "Database"); when set, `codeality-db audit` compares it against the live
 * schema (BDB330). `databaseTypeIgnores` lists tables that exist in the
 * database on purpose but are not in that type, for example tables owned by
 * an auth library.
 */
export type KyselyConfig = {
  roots: string[]
  objectNames: string[]
  migrations?: KyselyMigrationsConfig
  databaseType?: string
  databaseTypeIgnores?: string[]
}
