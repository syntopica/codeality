import type { PostgresTarget } from '@/postgres/PostgresTarget.js'
import { parsedUrl } from '@/postgres/parsedUrl.js'
import { refuseTransactionPooler } from '@/postgres/refuseTransactionPooler.js'

/** A connection url as a target whose url no longer carries the password: psql gets it through PGPASSWORD, never on its argument vector. */
export const targetFromUrl = (
  raw: string,
  source: string,
  fallbackPassword?: string,
): PostgresTarget => {
  const url = parsedUrl(raw, source)
  refuseTransactionPooler(url, source)
  const password = url.password
    ? decodeURIComponent(url.password)
    : fallbackPassword
  url.password = ''
  return {
    url: url.toString(),
    host: url.hostname,
    ...(password === undefined ? {} : { password }),
  }
}
