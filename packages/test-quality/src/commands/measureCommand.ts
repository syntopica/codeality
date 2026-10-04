import type { CommandIo } from '@/commands/CommandIo.js'
import { nodeCandidateFindings } from '@/commands/nodeCandidateFindings.js'
import { fileDurations } from '@/measure/fileDurations.js'
import { parseDurationBreakdown } from '@/measure/parseDurationBreakdown.js'
import { writeFindings } from '@/report/writeFindings.js'
import { environmentDominates } from '@/rules/environmentDominates.js'
import { memoryUse } from '@/rules/memoryUse.js'
import { slowestFiles } from '@/rules/slowestFiles.js'
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
  const findings = [
    {
      rule: 'suite-run',
      severity: 'info' as const,
      message: `vitest exited ${String(run.exitCode)} after ${run.wallSeconds.toFixed(1)} s wall`,
      evidence: [],
    },
    ...environmentDominates(parseDurationBreakdown(run.stdout)),
    ...slowestFiles(
      run.report ? fileDurations(run.report) : [],
      Number(values['top'] ?? 10),
    ),
    ...memoryUse(run.rssSamplesMb),
    ...(values['node-candidates'] === true
      ? await nodeCandidateFindings(io)
      : []),
  ]
  return writeFindings(findings, values['json'] === true, io)
}
