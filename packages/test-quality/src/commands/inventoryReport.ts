import type { CommandIo } from '@/commands/CommandIo.js'
import { nodeCandidates } from '@/inventory/nodeCandidates.js'
import type { Report } from '@/model/Report.js'
import { domCandidates } from '@/observations/domCandidates.js'
import { duplicateRuns } from '@/rules/duplicateRuns.js'

/** What the suite's own vitest config says it runs, without running it. */
export const inventoryReport = (io: CommandIo): Report => {
  const files = io.inventory(io.root)
  const { candidates, domFileCount } = nodeCandidates(
    files,
    (file) => io.readText(file) ?? '',
  )
  return {
    findings: duplicateRuns(files),
    observations: domCandidates(candidates, domFileCount),
  }
}
