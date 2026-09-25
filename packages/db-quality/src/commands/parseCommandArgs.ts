import { parseArgs } from 'node:util'

import type { ParsedArgs } from '@/commands/ParsedArgs.js'
import { ConfigError } from '@/config/ConfigError.js'

export const parseCommandArgs = (
  argv: string[],
  options: Record<string, { type: 'boolean' | 'string' }>,
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
