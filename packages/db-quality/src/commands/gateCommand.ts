import { sqliteQueriesNotice } from '@/check/sqliteQueriesNotice.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { legacyConfigNotice } from '@/config/legacyConfigNotice.js'
import { readConfig } from '@/config/readConfig.js'
import { gateExitCode } from '@/gate/gateExitCode.js'
import { gateStages } from '@/gate/gateStages.js'
import { renderGateReport } from '@/gate/renderGateReport.js'
import { runGate } from '@/gate/runGate.js'
import { parseCommandArgs } from '@syntopica/gate-kit/parseCommandArgs'
import { reportCommandError } from '@syntopica/gate-kit/reportCommandError'

export const gateCommand = (argv: string[], io: CommandIo): number => {
  try {
    const { values } = parseCommandArgs(argv, { json: { type: 'boolean' } })
    const config = readConfig(io.root)
    const notice = legacyConfigNotice(config)
    if (notice) io.stderr(`${notice}\n`)
    const skipped = sqliteQueriesNotice(io.runner, io.root, config)
    if (skipped) io.stderr(`${skipped}\n`)
    const results = runGate(
      gateStages({
        root: io.root,
        config,
        runner: io.runner,
      }),
    )
    const report =
      values['json'] === true
        ? JSON.stringify({ schemaVersion: 1, stages: results }, null, 2)
        : renderGateReport(results)
    io.stdout(`${report}\n`)
    return gateExitCode(results)
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
