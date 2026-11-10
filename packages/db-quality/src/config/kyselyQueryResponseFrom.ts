import { isPlainObject } from '@/config/isPlainObject.js'
import type { KyselyQueryResponse } from '@/config/KyselyQueryResponse.js'
import { kyselyQueryResponseScopeFrom } from '@/config/kyselyQueryResponseScopeFrom.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** One `kysely.migrations.queryResponses` entry, checked; ConfigError naming its index otherwise. */
export const kyselyQueryResponseFrom = (
  value: unknown,
  index: number,
): KyselyQueryResponse => {
  const where = `kysely.migrations.queryResponses[${String(index)}]`
  if (!isPlainObject(value)) throw new ConfigError(`${where} must be an object`)
  const { match, rows } = value
  if (typeof match !== 'string' || match.trim() === '')
    throw new ConfigError(`${where}.match must be a non-empty string`)
  if (!Array.isArray(rows) || !rows.every(isPlainObject))
    throw new ConfigError(`${where}.rows must be a list of objects`)
  return { match, rows, ...kyselyQueryResponseScopeFrom(value, where) }
}
