import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import { baselineActionFrom } from '@/baseline/baselineActionFrom.js'
import { renderClassified } from '@/baseline/renderClassified.js'
import { runCheck } from '@/check/runCheck.js'
import { writeReport } from '@/check/writeReport.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { readConfig } from '@/config/readConfig.js'
import { PACKAGE_VERSION } from '@/packageVersion.js'
import { classifyFindings } from '@syntopica/gate-kit/classifyFindings'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'
import { ExitCode } from '@syntopica/gate-kit/ExitCode'
import { parseCommandArgs } from '@syntopica/gate-kit/parseCommandArgs'
import { readBaseline } from '@syntopica/gate-kit/readBaseline'
import { reportCommandError } from '@syntopica/gate-kit/reportCommandError'
import { writeBaseline } from '@syntopica/gate-kit/writeBaseline'

export const baselineCommand = async (
  argv: string[],
  io: CommandIo,
): Promise<number> => {
  try {
    const { values, positionals } = parseCommandArgs(argv, {
      'check-stale': { type: 'boolean' },
    })
    const action = baselineActionFrom(positionals)
    if (action === 'create' && existsSync(join(io.root, BASELINE_FILENAME))) {
      throw new ConfigError(
        `${BASELINE_FILENAME} exists; use "baseline update" to rewrite it`,
      )
    }
    const config = readConfig(io.root)
    const result = await runCheck(io.root, config, io.stderr)
    writeReport(io.root, result)
    if (action !== 'check') {
      writeBaseline(io.root, BASELINE_FILENAME, {
        schemaVersion: 1,
        toolVersion: PACKAGE_VERSION,
        entries: result.findings.map((finding) => finding.fingerprint),
      })
      io.stdout(
        `recorded ${String(result.findings.length)} findings in ${BASELINE_FILENAME}\n`,
      )
      return ExitCode.OK
    }
    const classified = classifyFindings(
      result.findings,
      readBaseline(io.root, BASELINE_FILENAME, 'codeality-ui'),
    )
    io.stdout(`${renderClassified(classified)}\n`)
    const stale =
      values['check-stale'] === true && classified.resolved.length > 0
    return classified.new.length > 0 || stale ? ExitCode.FINDINGS : ExitCode.OK
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
