import type { CommandIo } from '@/commands/CommandIo.js'
import { nodeCandidateFindings } from '@/commands/nodeCandidateFindings.js'
import { fileDurations } from '@/measure/fileDurations.js'
import { parseDurationBreakdown } from '@/measure/parseDurationBreakdown.js'
import { hostLoad } from '@/observations/hostLoad.js'
import { memoryUse } from '@/observations/memoryUse.js'
import { phaseSharesObservation } from '@/observations/phaseSharesObservation.js'
import { slowestFiles } from '@/observations/slowestFiles.js'
import { suiteRun } from '@/observations/suiteRun.js'
import { workerProcesses } from '@/observations/workerProcesses.js'
import { writeReport } from '@/report/writeReport.js'
import { environmentDominates } from '@/rules/environmentDominates.js'
import { parseCommandArgs } from '@syntopica/gate-kit/parseCommandArgs'

/** Runs the suite once, measured; `--node-candidates` adds a second run under node. */
export const measureCommand = async (
  argv: string[],
  io: CommandIo,
): Promise<number> => {
  const { values, positionals } = parseCommandArgs(argv, {
    json: { type: 'boolean' },
    'node-candidates': { type: 'boolean' },
    top: { type: 'string' },
  })
  const run = await io.runVitest(io.root, positionals)
  const breakdown = parseDurationBreakdown(run.stdout)
  const findings = [
    ...environmentDominates(breakdown),
    ...(values['node-candidates'] === true
      ? await nodeCandidateFindings(io)
      : []),
  ]
  const observations = [
    suiteRun(run),
    hostLoad(run.host),
    ...phaseSharesObservation(breakdown),
    ...slowestFiles(
      run.report ? fileDurations(run.report) : [],
      Number(values['top'] ?? 10),
    ),
    ...memoryUse(run.rssSamplesMb),
    ...workerProcesses(run.workerSamples),
  ]
  return writeReport({ findings, observations }, values['json'] === true, io)
}
