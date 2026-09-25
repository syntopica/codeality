import { renderFindings } from '@/check/renderFindings.js'
import { renderFindingsJson } from '@/check/renderFindingsJson.js'
import { runCheck } from '@/check/runCheck.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { reportCommandError } from '@/commands/reportCommandError.js'
import { legacyConfigNotice } from '@/config/legacyConfigNotice.js'
import { readConfig } from '@/config/readConfig.js'
import { ExitCode } from '@/model/ExitCode.js'

export const checkCommand = (argv: string[], io: CommandIo): number => {
  try {
    const { values } = parseCommandArgs(argv, { json: { type: 'boolean' } })
    const config = readConfig(io.root)
    const notice = legacyConfigNotice(config)
    if (notice) io.stderr(`${notice}\n`)
    const findings = runCheck({
      root: io.root,
      config,
      runner: io.runner,
    })
    io.stdout(
      `${values['json'] === true ? renderFindingsJson(findings) : renderFindings(findings)}\n`,
    )
    return findings.length > 0 ? ExitCode.FINDINGS : ExitCode.OK
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
