import { COMMANDS } from '@/cli/COMMANDS.js'
import { USAGE } from '@/cli/USAGE.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { ExitCode } from '@/model/ExitCode.js'
import { PACKAGE_VERSION } from '@/packageVersion.js'

/** Dispatches the argument vector (without the node and script entries) and returns the exit code. */
export const runCli = (argv: string[], io: CommandIo): number => {
  const args = [...argv]
  if (args.includes('--version')) {
    io.stdout(`codeality-db ${PACKAGE_VERSION}\n`)
    return ExitCode.OK
  }
  if (args.includes('--help') || args.includes('-h')) {
    io.stdout(USAGE)
    return ExitCode.OK
  }
  let root = io.root
  if (args[0] === '--project') {
    root = args[1] ?? ''
    args.splice(0, 2)
  }
  const [command, ...rest] = args
  const handler = command === undefined ? undefined : COMMANDS[command]
  if (!handler) {
    io.stderr(USAGE)
    return ExitCode.CONFIGURATION
  }
  return handler(rest, { ...io, root })
}
