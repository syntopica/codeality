import type { DisableEntry } from '@/config/DisableEntry.js'
import type { KyselyConfig } from '@/config/KyselyConfig.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** Parameters for running the Kysely type drift audit against a live database. */
export type RunKyselyTypeDriftOptions = {
  runner: CommandRunner
  root: string
  kysely: KyselyConfig
  dbUrl: string
  disabled: DisableEntry[]
}
