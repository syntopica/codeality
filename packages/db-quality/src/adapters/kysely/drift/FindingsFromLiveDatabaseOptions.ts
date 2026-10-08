import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** Parameters for introspecting the live database and comparing both probes. */
export type FindingsFromLiveDatabaseOptions = {
  runner: CommandRunner
  root: string
  scratch: string
  ref: DatabaseTypeRef
  dialect: 'postgres' | 'mysql'
  dbUrl: string
  databaseTypeIgnores: string[]
  disabled: DisableEntry[]
}
