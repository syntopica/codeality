import type { DisableEntry } from '@/config/DisableEntry.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** What the plan check needs: the readable database, its tables and the row threshold. */
export type QueryPlanContext = {
  runner: CommandRunner
  root: string
  database: string
  tables: Map<string, string>
  minRows: number
  disabled: DisableEntry[]
}
