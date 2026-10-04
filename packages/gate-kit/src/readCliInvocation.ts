import type { CliInvocation } from './CliInvocation.js'

/**
 * Reads the flags every gate CLI shares: `--version`, `--help`/`-h`, and a
 * leading `--project <dir>` that replaces the default root. An empty root
 * means `--project` came without a directory.
 */
export const readCliInvocation = (
  argv: string[],
  defaultRoot: string,
): CliInvocation => {
  if (argv.includes('--version')) return { kind: 'version' }
  if (argv.includes('--help') || argv.includes('-h')) return { kind: 'help' }
  const project = argv[0] === '--project'
  const [command, ...rest] = project ? argv.slice(2) : argv
  return {
    kind: 'command',
    root: project ? (argv[1] ?? '') : defaultRoot,
    command,
    rest,
  }
}
