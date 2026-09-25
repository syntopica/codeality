import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import { baselineActionFrom } from '@/baseline/baselineActionFrom.js'
import { classifyFindings } from '@/baseline/classifyFindings.js'
import { readBaseline } from '@/baseline/readBaseline.js'
import { renderClassified } from '@/baseline/renderClassified.js'
import { writeBaseline } from '@/baseline/writeBaseline.js'
import { runCheck } from '@/check/runCheck.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { reportCommandError } from '@/commands/reportCommandError.js'
import { ConfigError } from '@/config/ConfigError.js'
import { readConfig } from '@/config/readConfig.js'
import { ExitCode } from '@/model/ExitCode.js'
import { PACKAGE_VERSION } from '@/packageVersion.js'

export const baselineCommand = (argv: string[], io: CommandIo): number => {
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
    const findings = runCheck({
      root: io.root,
      config: readConfig(io.root),
      runner: io.runner,
    })
    if (action !== 'check') {
      const entries = findings.map((f) => f.fingerprint)
      writeBaseline(io.root, {
        schemaVersion: 1,
        toolVersion: PACKAGE_VERSION,
        entries,
      })
      io.stdout(
        `recorded ${String(findings.length)} findings in ${BASELINE_FILENAME}\n`,
      )
      return ExitCode.OK
    }
    const classified = classifyFindings(findings, readBaseline(io.root))
    io.stdout(`${renderClassified(classified)}\n`)
    const stale =
      values['check-stale'] === true && classified.resolved.length > 0
    return classified.new.length > 0 || stale ? ExitCode.FINDINGS : ExitCode.OK
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
