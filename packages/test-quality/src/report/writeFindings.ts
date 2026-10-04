import type { CommandIo } from '@/commands/CommandIo.js'
import type { Finding } from '@/model/Finding.js'
import { formatFindings } from '@/report/formatters/formatFindings.js'
import { ExitCode } from '@syntopica/gate-kit/ExitCode'

/** Prints the findings and returns 1 when any is a warning, 0 otherwise. */
export const writeFindings = (
  findings: Finding[],
  json: boolean,
  io: CommandIo,
): number => {
  io.stdout(
    json
      ? `${JSON.stringify({ schemaVersion: 1, findings }, null, 2)}\n`
      : formatFindings(findings),
  )
  return findings.some((finding) => finding.severity === 'warning')
    ? ExitCode.FINDINGS
    : ExitCode.OK
}
