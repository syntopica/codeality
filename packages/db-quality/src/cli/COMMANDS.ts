import { auditCommand } from '@/commands/auditCommand.js'
import { baselineCommand } from '@/commands/baselineCommand.js'
import { checkCommand } from '@/commands/checkCommand.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { gateCommand } from '@/commands/gateCommand.js'
import { initCommand } from '@/commands/initCommand.js'

export const COMMANDS: Record<
  string,
  (argv: string[], io: CommandIo) => number
> = {
  init: initCommand,
  check: checkCommand,
  audit: auditCommand,
  gate: gateCommand,
  baseline: baselineCommand,
}
