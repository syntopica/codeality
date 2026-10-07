import { KYSELY_HASH_FILENAME } from '@/adapters/kysely/KYSELY_HASH_FILENAME.js'
import { locatedMigrations } from '@/adapters/kysely/locatedMigrations.js'
import { readKyselyHashFile } from '@/adapters/kysely/readKyselyHashFile.js'
import { updatedHashFile } from '@/adapters/kysely/updatedHashFile.js'
import { writeKyselyHashFile } from '@/adapters/kysely/writeKyselyHashFile.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { kyselyDialectsOf } from '@/config/kyselyDialectsOf.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** Writes .codeality-db-kysely.json for `baseline create|update`; the line to print, or undefined without Kysely migrations. */
export const recordKyselyHashes = (
  runner: CommandRunner,
  root: string,
  config: DbQualityConfig,
  acceptEdits: string[],
): string | undefined => {
  const migrationsConfig = config.kysely?.migrations
  if (!migrationsConfig) {
    if (acceptEdits.length > 0)
      throw new ConfigError('--accept-edit needs a kysely.migrations section')
    return undefined
  }
  const migrations = locatedMigrations(
    runner,
    root,
    migrationsConfig,
    kyselyDialectsOf(root, migrationsConfig),
  )
  const next = updatedHashFile(
    readKyselyHashFile(root),
    migrations,
    acceptEdits,
  )
  writeKyselyHashFile(root, next)
  return `recorded ${String(Object.keys(next.migrations).length)} Kysely migrations in ${KYSELY_HASH_FILENAME}`
}
