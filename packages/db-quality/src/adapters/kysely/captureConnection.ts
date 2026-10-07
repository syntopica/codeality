import type { CompiledQuery, DatabaseConnection, QueryResult } from 'kysely'

import type { KyselyStatement } from '@/adapters/kysely/KyselyStatement.js'
import { recordQuery } from '@/adapters/kysely/recordQuery.js'

/** A connection that records every query into `sink` and answers with no rows. */
export const captureConnection = (
  sink: KyselyStatement[],
): DatabaseConnection => ({
  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    recordQuery(sink, compiledQuery)
    return await Promise.resolve({ rows: [] })
  },
  async *streamQuery<R>(
    compiledQuery: CompiledQuery,
  ): AsyncIterableIterator<QueryResult<R>> {
    recordQuery(sink, compiledQuery)
    yield await Promise.resolve({ rows: [] })
  },
})
