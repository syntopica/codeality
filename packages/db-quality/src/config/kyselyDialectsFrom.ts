import { isStringList } from '@/config/isStringList.js'
import { KYSELY_DIALECTS } from '@/config/KYSELY_DIALECTS.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** `kysely.migrations.dialects` checked against the known dialects; undefined when absent. */
export const kyselyDialectsFrom = (
  value: unknown,
): KyselyDialect[] | undefined => {
  if (value === undefined) return undefined
  const known: readonly string[] = KYSELY_DIALECTS
  if (
    !isStringList(value) ||
    value.length === 0 ||
    !value.every((name) => known.includes(name))
  )
    throw new ConfigError(
      `kysely.migrations.dialects must be a non-empty list of ${KYSELY_DIALECTS.join(', ')}`,
    )
  return value as KyselyDialect[]
}
