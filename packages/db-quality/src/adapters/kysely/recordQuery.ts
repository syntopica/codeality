import type { CompiledQuery } from 'kysely'

import { jsonSafeParameter } from '@/adapters/kysely/jsonSafeParameter.js'
import type { KyselyStatement } from '@/adapters/kysely/KyselyStatement.js'

export const recordQuery = (
  sink: KyselyStatement[],
  compiledQuery: CompiledQuery,
): void => {
  sink.push({
    sql: compiledQuery.sql,
    parameters: compiledQuery.parameters.map(jsonSafeParameter),
  })
}
