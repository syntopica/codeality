import { parseArgs } from 'node:util'

import { CHECK_OPTIONS } from '@/commands/CHECK_OPTIONS.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** Validate already-parsed arguments before reading config or writing artifacts. */
export const assertSingleRoutesOption = (argv: string[]): void => {
  const { tokens } = parseArgs({
    args: argv,
    options: CHECK_OPTIONS,
    allowPositionals: true,
    strict: true,
    tokens: true,
  })
  let seen = false
  for (const token of tokens) {
    if (token.kind !== 'option' || token.name !== 'routes') continue
    if (seen) throw new ConfigError('--routes may only be specified once')
    seen = true
  }
}
