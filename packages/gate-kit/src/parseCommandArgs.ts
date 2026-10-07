import { parseArgs } from 'node:util'

import type { CommandOption } from './CommandOption.js'
import { ConfigError } from './ConfigError.js'
import type { ParsedArgs } from './ParsedArgs.js'

export const parseCommandArgs = (
  argv: string[],
  options: Record<string, CommandOption>,
): ParsedArgs => {
  try {
    const parsed = parseArgs({
      args: argv,
      options,
      allowPositionals: true,
      strict: true,
    })
    return { values: parsed.values, positionals: parsed.positionals }
  } catch (error) {
    throw new ConfigError((error as Error).message)
  }
}
