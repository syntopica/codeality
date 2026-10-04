import { checkCommand } from '@/commands/checkCommand.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { measureCommand } from '@/commands/measureCommand.js'

export const COMMANDS: Record<
  string,
  (argv: string[], io: CommandIo) => Promise<number>
> = {
  check: checkCommand,
  measure: measureCommand,
}
