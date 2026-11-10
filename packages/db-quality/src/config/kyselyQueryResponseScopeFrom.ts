import type { KyselyQueryResponse } from '@/config/KyselyQueryResponse.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** A query response entry's optional `migration` and `step`, checked; `where` names the entry. */
export const kyselyQueryResponseScopeFrom = (
  value: Record<string, unknown>,
  where: string,
): Pick<KyselyQueryResponse, 'migration' | 'step'> => {
  const { migration, step } = value
  if (migration !== undefined && typeof migration !== 'string')
    throw new ConfigError(`${where}.migration must be a string`)
  if (step !== undefined && step !== 'up' && step !== 'down')
    throw new ConfigError(`${where}.step must be "up" or "down"`)
  return {
    ...(migration === undefined ? {} : { migration }),
    ...(step === undefined ? {} : { step }),
  }
}
