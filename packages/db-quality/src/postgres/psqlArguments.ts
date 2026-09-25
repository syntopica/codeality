/** The `psql` argument vector for one session: read-only and timed out before the statements run, every call. */
export const psqlArguments = (
  url: string,
  timeoutMs: number,
  statements: string[],
): string[] => [
  url,
  '-X',
  '-q',
  '-A',
  '-t',
  '-v',
  'ON_ERROR_STOP=1',
  '-c',
  'set default_transaction_read_only = on',
  '-c',
  `set statement_timeout = ${String(timeoutMs)}`,
  ...statements.flatMap((statement) => ['-c', statement]),
]
