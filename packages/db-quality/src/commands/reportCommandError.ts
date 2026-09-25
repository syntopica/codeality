import { ConfigError } from '@/config/ConfigError.js'
import { ExitCode } from '@/model/ExitCode.js'

/** Prints the failure and returns its exit code: 2 for configuration, 3 for everything else. */
export const reportCommandError = (
  error: unknown,
  stderr: (text: string) => void,
): number => {
  const configuration = error instanceof ConfigError
  const message = error instanceof Error ? error.message : String(error)
  stderr(`${configuration ? 'configuration error' : 'error'}: ${message}\n`)
  return configuration ? ExitCode.CONFIGURATION : ExitCode.INFRASTRUCTURE
}
