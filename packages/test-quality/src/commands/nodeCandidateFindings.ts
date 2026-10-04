import type { CommandIo } from '@/commands/CommandIo.js'
import { nodeCandidates } from '@/inventory/nodeCandidates.js'
import { passingFiles } from '@/measure/passingFiles.js'
import type { Finding } from '@/model/Finding.js'
import { nodeMovable } from '@/rules/nodeMovable.js'

/** Runs the DOM-free candidates under node and reports the ones that pass. */
export const nodeCandidateFindings = async (
  io: CommandIo,
): Promise<Finding[]> => {
  const { candidates } = nodeCandidates(
    io.inventory(io.root),
    (file) => io.readText(file) ?? '',
  )
  if (candidates.length === 0) return []
  const run = await io.runVitest(io.root, [
    '--environment',
    'node',
    ...candidates,
  ])
  return nodeMovable(passingFiles(run.report), candidates.length)
}
