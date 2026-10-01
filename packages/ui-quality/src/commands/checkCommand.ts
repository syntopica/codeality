import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import { renderClassified } from '@/baseline/renderClassified.js'
import { runCheck } from '@/check/runCheck.js'
import { writeReport } from '@/check/writeReport.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { readConfig } from '@/config/readConfig.js'
import { renderFindings } from '@/report/renderFindings.js'
import { renderFindingsJson } from '@/report/renderFindingsJson.js'
import { classifyFindings } from '@syntopica/gate-kit/classifyFindings'
import { ExitCode } from '@syntopica/gate-kit/ExitCode'
import { parseCommandArgs } from '@syntopica/gate-kit/parseCommandArgs'
import { readBaseline } from '@syntopica/gate-kit/readBaseline'
import { reportCommandError } from '@syntopica/gate-kit/reportCommandError'

// With a baseline present only new findings fail the run; without one,
// every finding does.
export const checkCommand = async (
  argv: string[],
  io: CommandIo,
): Promise<number> => {
  try {
    const { values } = parseCommandArgs(argv, { json: { type: 'boolean' } })
    const config = readConfig(io.root)
    const result = await runCheck(io.root, config, io.stderr)
    const report = writeReport(io.root, result)
    io.stderr(`report: ${report}\n`)
    if (values['json'] === true) {
      io.stdout(`${renderFindingsJson(result.findings)}\n`)
    } else if (!existsSync(join(io.root, BASELINE_FILENAME))) {
      io.stdout(`${renderFindings(result.findings)}\n`)
    }
    if (!existsSync(join(io.root, BASELINE_FILENAME))) {
      return result.findings.length > 0 ? ExitCode.FINDINGS : ExitCode.OK
    }
    const classified = classifyFindings(
      result.findings,
      readBaseline(io.root, BASELINE_FILENAME, 'codeality-ui'),
    )
    if (values['json'] !== true) io.stdout(`${renderClassified(classified)}\n`)
    return classified.new.length > 0 ? ExitCode.FINDINGS : ExitCode.OK
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
