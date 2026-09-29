import { probeQueryDatabase } from '@/adapters/sqlite/probeQueryDatabase.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// A missing sqlite3 is left for the check itself to report, where the gate
// can name the stage it broke.
/** One line for stderr when the plan check was configured but could not run; nothing otherwise. */
export const sqliteQueriesNotice = (
  runner: CommandRunner,
  root: string,
  config: DbQualityConfig,
): string | undefined => {
  const database = config.sqlite?.queries?.database
  if (database === undefined || isDisabled('BDB406', config.disable))
    return undefined
  try {
    const probe = probeQueryDatabase(runner, root, database)
    return 'unavailable' in probe
      ? `sqlite.queries.database ${probe.path} ${probe.unavailable}; the query-plan check BDB406 was skipped`
      : undefined
  } catch (error) {
    if (error instanceof ToolMissingError) return undefined
    throw error
  }
}
