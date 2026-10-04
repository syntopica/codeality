/**
 * The commands a git hook runs, from `lefthook.yml` (every `run:` under the
 * hook's block) or a husky script (every non-comment line).
 */
export const hookCommands = (
  hook: string,
  lefthook: string | undefined,
  husky: string | undefined,
): string[] => {
  const commands: string[] = []
  if (husky !== undefined) {
    commands.push(
      ...husky
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '' && !line.startsWith('#')),
    )
  }
  let inHook = false
  for (const line of (lefthook ?? '').split('\n')) {
    if (/^\S/.test(line)) inHook = line.startsWith(`${hook}:`)
    const run = /^\s+run:(.+)$/.exec(line)
    if (inHook && run?.[1] !== undefined) commands.push(run[1].trim())
  }
  return commands
}
