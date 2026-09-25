import type { CommandIo } from '@/commands/CommandIo.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { reportCommandError } from '@/commands/reportCommandError.js'
import { readConfig } from '@/config/readConfig.js'
import { gateExitCode } from '@/gate/gateExitCode.js'
import { gateStages } from '@/gate/gateStages.js'
import { renderGateReport } from '@/gate/renderGateReport.js'
import { runGate } from '@/gate/runGate.js'

export const gateCommand = (argv: string[], io: CommandIo): number => {
  try {
    const { values } = parseCommandArgs(argv, { json: { type: 'boolean' } })
    const results = runGate(
      gateStages({
        root: io.root,
        config: readConfig(io.root),
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
