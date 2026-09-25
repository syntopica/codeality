/** `systemPathOnly` resolves the command from the shell's PATH alone, never from a project's or this package's node_modules/.bin. */
export type CommandOptions = {
  cwd: string
  env?: Record<string, string>
  systemPathOnly?: boolean
}
