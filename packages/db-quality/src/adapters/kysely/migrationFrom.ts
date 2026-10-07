import type { LoadedMigration } from '@/adapters/kysely/LoadedMigration.js'
import type { MigrationCandidate } from '@/adapters/kysely/MigrationCandidate.js'
import type { MigrationStep } from '@/adapters/kysely/MigrationStep.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** A value checked to be a Kysely `Migration`: an `up` function and an optional `down` one. */
export const migrationFrom = (
  value: unknown,
  name: string,
  path: string,
): LoadedMigration => {
  const candidate = (value ?? {}) as MigrationCandidate
  if (typeof candidate.up !== 'function')
    throw new ConfigError(`kysely migration "${name}" in ${path} has no up()`)
  if (candidate.down !== undefined && typeof candidate.down !== 'function')
    throw new ConfigError(
      `kysely migration "${name}" in ${path} has a down that is not a function`,
    )
  return {
    name,
    path,
    up: candidate.up as MigrationStep,
    ...(candidate.down === undefined
      ? {}
      : { down: candidate.down as MigrationStep }),
  }
}
