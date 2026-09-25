import type { CommandOptions } from '@/tools/CommandOptions.js'
import type { CommandResult } from '@/tools/CommandResult.js'

/** Every external tool goes through one of these, so tests can hand back saved output. */
export type CommandRunner = (
  command: string,
  args: string[],
  options: CommandOptions,
) => CommandResult
