import { ConfigError } from '@/config/ConfigError.js'

/**
 * A transaction pooler hands each statement to whichever backend is free, so
 * the read-only SET and the query can land on different connections, and the
 * SET stays behind on a connection the application shares.
 */
export const refuseTransactionPooler = (url: URL, source: string): void => {
  if (url.port !== '6543' && url.searchParams.get('pgbouncer') !== 'true')
    return
  throw new ConfigError(
    `${source} points at a transaction pooler (port 6543 or pgbouncer=true), where the read-only setting does not hold; use the session pooler (port 5432) or a direct connection`,
  )
}
