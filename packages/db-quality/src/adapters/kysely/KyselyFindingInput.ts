import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import type { Severity } from '@/model/Severity.js'

/** One BDB320 finding on a migration, before the disable list and the fingerprint. */
export type KyselyFindingInput = {
  rule: string
  severity: Severity
  migration: LocatedMigration
  message: string
  context: string
}
