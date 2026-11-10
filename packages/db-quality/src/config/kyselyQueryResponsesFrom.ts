import type { KyselyQueryResponse } from '@/config/KyselyQueryResponse.js'
import { kyselyQueryResponseFrom } from '@/config/kyselyQueryResponseFrom.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** `kysely.migrations.queryResponses` checked entry by entry; undefined when absent. */
export const kyselyQueryResponsesFrom = (
  value: unknown,
): KyselyQueryResponse[] | undefined => {
  if (value === undefined) return undefined
  if (!Array.isArray(value))
    throw new ConfigError('kysely.migrations.queryResponses must be a list')
  return value.map(kyselyQueryResponseFrom)
}
