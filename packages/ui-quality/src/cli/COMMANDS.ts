import type { Command } from '@/cli/Command.js'
import { baselineCommand } from '@/commands/baselineCommand.js'
import { checkCommand } from '@/commands/checkCommand.js'
import { initCommand } from '@/commands/initCommand.js'

export const COMMANDS: Record<string, Command> = {
  init: initCommand,
  check: checkCommand,
  baseline: baselineCommand,
}
