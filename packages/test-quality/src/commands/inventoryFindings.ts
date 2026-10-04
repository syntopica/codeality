import type { CommandIo } from '@/commands/CommandIo.js'
import { nodeCandidates } from '@/inventory/nodeCandidates.js'
import type { Finding } from '@/model/Finding.js'
import { domWithoutDom } from '@/rules/domWithoutDom.js'
import { duplicateRuns } from '@/rules/duplicateRuns.js'

/** What the suite's own vitest config says it runs, without running it. */
export const inventoryFindings = (io: CommandIo): Finding[] => {
  const files = io.inventory(io.root)
  const { candidates, domFileCount } = nodeCandidates(
    files,
    (file) => io.readText(file) ?? '',
  )
  return [...duplicateRuns(files), ...domWithoutDom(candidates, domFileCount)]
}
