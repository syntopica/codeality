// The shell names the argument it failed on ("Parse error in 5th command line
// argument: ..."); each statement is its own argument, so that names the
// statement. Anything else is reported by its first line.
/** sqlite3's error as one line, naming the statement it refused when the shell says which. */
export const sqliteFailureReason = (stderr: string, args: string[]): string => {
  const first = stderr.trim().split('\n')[0] ?? ''
  const match =
    /^\w+ error in (\d+)(?:st|nd|rd|th) command line argument: (.*)$/.exec(
      first,
    )
  if (!match) return first.replace(/^Error: /, '')
  const statement = args[Number(match[1]) - 1]
  return statement === undefined
    ? (match[2] ?? first)
    : `${match[2] ?? ''} in: ${statement}`
}
