import { COMMANDS } from '@/cli/COMMANDS.js'
import { USAGE } from '@/cli/USAGE.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { PACKAGE_VERSION } from '@/packageVersion.js'
import { ExitCode } from '@syntopica/gate-kit/ExitCode'
import { readCliInvocation } from '@syntopica/gate-kit/readCliInvocation'
import { reportCommandError } from '@syntopica/gate-kit/reportCommandError'

/** Dispatches the argument vector (without node and script) and resolves to the exit code. */
export const runCli = async (
  argv: string[],
  io: CommandIo,
): Promise<number> => {
  const invocation = readCliInvocation(argv, io.root)
  if (invocation.kind !== 'command') {
    io.stdout(
      invocation.kind === 'version'
        ? `codeality-test ${PACKAGE_VERSION}\n`
        : USAGE,
    )
    return ExitCode.OK
  }
  const { root, command, rest } = invocation
  const handler = command === undefined ? undefined : COMMANDS[command]
  if (!handler || root === '') {
    io.stderr(USAGE)
    return ExitCode.CONFIGURATION
  }
  try {
    return await handler(rest, { ...io, root })
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
