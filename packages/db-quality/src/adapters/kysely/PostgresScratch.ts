import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

/** A migration's compiled PostgreSQL up as a scratch `.sql` file squawk can read. */
export type PostgresScratch = {
  file: MigrationFile
  migration: LocatedMigration
}
