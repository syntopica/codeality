import type { CommandIo } from '@/commands/CommandIo.js'
import { hookFindings } from '@/commands/hookFindings.js'
import { inventoryFindings } from '@/commands/inventoryFindings.js'
import { writeFindings } from '@/report/writeFindings.js'
import { parseCommandArgs } from '@syntopica/gate-kit/parseCommandArgs'

/** Static findings: the suite's config and the git hooks, nothing executed. */
export const checkCommand = async (
  argv: string[],
  io: CommandIo,
): Promise<number> => {
  const { values } = parseCommandArgs(argv, { json: { type: 'boolean' } })
  return Promise.resolve(
    writeFindings(
      [...inventoryFindings(io), ...hookFindings(io)],
      values['json'] === true,
      io,
    ),
  )
}
