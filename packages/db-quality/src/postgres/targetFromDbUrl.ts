import { ConfigError } from '@/config/ConfigError.js'
import type { PostgresTarget } from '@/postgres/PostgresTarget.js'

/** A `--db-url` as a target whose url no longer carries the password: psql gets it through PGPASSWORD, never on its argument vector. */
export const targetFromDbUrl = (explicit: string): PostgresTarget => {
  let url: URL
  try {
    url = new URL(explicit)
  } catch {
    throw new ConfigError('--db-url is not a valid url')
  }
  const password = url.password ? decodeURIComponent(url.password) : undefined
  url.password = ''
  return {
    url: url.toString(),
    host: url.hostname,
    ...(password === undefined ? {} : { password }),
  }
}
