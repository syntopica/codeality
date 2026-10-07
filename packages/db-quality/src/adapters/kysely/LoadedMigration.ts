import type { MigrationStep } from '@/adapters/kysely/MigrationStep.js'

/** A migration loaded from the project, with the root-relative file that declares it. */
export type LoadedMigration = {
  name: string
  path: string
  up: MigrationStep
  down?: MigrationStep
}
