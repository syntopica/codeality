import type { CommandIo } from '@/commands/CommandIo.js'
import { hookFindings } from '@/commands/hookFindings.js'
import { hookObservations } from '@/commands/hookObservations.js'
import { hookReaches } from '@/commands/hookReaches.js'
import { inventoryReport } from '@/commands/inventoryReport.js'
import { writeReport } from '@/report/writeReport.js'
import { parseCommandArgs } from '@syntopica/gate-kit/parseCommandArgs'

/** Static findings: the suite's config and the git hooks, nothing executed. */
export const checkCommand = async (
  argv: string[],
  io: CommandIo,
): Promise<number> => {
  const { values } = parseCommandArgs(argv, { json: { type: 'boolean' } })
  const reaches = hookReaches(io)
  const inventory = inventoryReport(io)
  return Promise.resolve(
    writeReport(
      {
        findings: [...inventory.findings, ...hookFindings(reaches)],
        observations: [...inventory.observations, ...hookObservations(reaches)],
      },
      values['json'] === true,
      io,
    ),
  )
}
