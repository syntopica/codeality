/** The `psql` argument vector for one statement: read-only and timed out before it runs, every call. */
export const psqlArguments = (
  url: string,
  timeoutMs: number,
  sql: string,
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
  '-c',
  sql,
]
