import { inferredKyselyDialects } from '@/config/inferredKyselyDialects.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'
import type { KyselyMigrationsConfig } from '@/config/KyselyMigrationsConfig.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** The configured dialects, else the ones the installed drivers imply; ConfigError when neither names one. */
export const kyselyDialectsOf = (
  root: string,
  migrations: KyselyMigrationsConfig,
): KyselyDialect[] => {
  const dialects = migrations.dialects ?? inferredKyselyDialects(root)
  if (dialects.length === 0)
    throw new ConfigError(
      'kysely.migrations.dialects is not set and no driver (pg, mysql2, better-sqlite3) is a dependency; list the dialects the project supports',
    )
  return dialects
}
