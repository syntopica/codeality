import { auditPlan } from '@/audit/auditPlan.js'
import { resolveAuditTarget } from '@/audit/resolveAuditTarget.js'
import { runAudit } from '@/audit/runAudit.js'
import { renderFindings } from '@/check/renderFindings.js'
import { renderFindingsJson } from '@/check/renderFindingsJson.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { reportCommandError } from '@/commands/reportCommandError.js'
import { readConfig } from '@/config/readConfig.js'
import { ExitCode } from '@/model/ExitCode.js'

export const auditCommand = (argv: string[], io: CommandIo): number => {
  try {
    const { values } = parseCommandArgs(argv, {
      json: { type: 'boolean' },
      linked: { type: 'boolean' },
      'db-url': { type: 'string' },
    })
    const config = readConfig(io.root)
    const target = resolveAuditTarget(io.root, {
      linked: values['linked'] === true,
      'db-url': values['db-url'] as string | undefined,
    })
    for (const notice of auditPlan(config, target).skipped)
      io.stderr(`${notice}\n`)
    const findings = runAudit({
      root: io.root,
      config,
      runner: io.runner,
      target,
    })
    io.stdout(
      `${values['json'] === true ? renderFindingsJson(findings) : renderFindings(findings)}\n`,
    )
    return findings.length > 0 ? ExitCode.FINDINGS : ExitCode.OK
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
