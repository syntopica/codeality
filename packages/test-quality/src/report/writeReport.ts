import type { CommandIo } from '@/commands/CommandIo.js'
import type { Report } from '@/model/Report.js'
import { formatReport } from '@/report/formatters/formatReport.js'
import { ExitCode } from '@syntopica/gate-kit/ExitCode'

/** Prints the report and returns 1 when it holds any finding, 0 otherwise. */
export const writeReport = (
  report: Report,
  json: boolean,
  io: CommandIo,
): number => {
  io.stdout(
    json
      ? `${JSON.stringify({ schemaVersion: 2, ...report }, null, 2)}\n`
      : formatReport(report),
  )
  return report.findings.length > 0 ? ExitCode.FINDINGS : ExitCode.OK
}
