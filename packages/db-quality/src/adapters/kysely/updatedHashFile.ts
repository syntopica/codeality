import { acceptedHashes } from '@/adapters/kysely/acceptedHashes.js'
import type { CompiledMigration } from '@/adapters/kysely/CompiledMigration.js'
import type { KyselyHashFile } from '@/adapters/kysely/KyselyHashFile.js'
import { migrationHashes } from '@/adapters/kysely/migrationHashes.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

// A new migration is added; a released one keeps its hashes unless what it
// compiles to changed, which is refused unless its name is accepted. A
// recorded migration that no longer exists stays recorded.
/** The hash file after recording the current migrations; ConfigError on an edit not accepted. */
export const updatedHashFile = (
  existing: KyselyHashFile | undefined,
  migrations: CompiledMigration[],
  acceptEdits: string[],
): KyselyHashFile => {
  const recorded = { ...existing?.migrations }
  const refused: string[] = []
  for (const migration of migrations) {
    const hashes = acceptedHashes(
      recorded[migration.name],
      migrationHashes(migration),
      acceptEdits.includes(migration.name),
    )
    if (hashes === undefined) refused.push(migration.name)
    else recorded[migration.name] = hashes
  }
  const unknown = acceptEdits.filter(
    (name) => !migrations.some((migration) => migration.name === name),
  )
  if (unknown.length > 0)
    throw new ConfigError(
      `--accept-edit names no migration: ${unknown.join(', ')}`,
    )
  if (refused.length > 0)
    throw new ConfigError(
      `released Kysely migrations were edited: ${refused.join(', ')}; restore them and add a new migration, or pass --accept-edit ${refused.join(',')}`,
    )
  return { schemaVersion: 1, migrations: recorded }
}
