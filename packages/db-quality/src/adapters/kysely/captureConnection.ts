import type { CompiledQuery, DatabaseConnection, QueryResult } from 'kysely'

import type { KyselyStatement } from '@/adapters/kysely/KyselyStatement.js'
import type { QueryAnswer } from '@/adapters/kysely/QueryAnswer.js'
import { recordQuery } from '@/adapters/kysely/recordQuery.js'

/** A connection that records every query into `sink` and answers with `answer`'s rows. */
export const captureConnection = (
  sink: KyselyStatement[],
  answer: QueryAnswer,
): DatabaseConnection => ({
  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    recordQuery(sink, compiledQuery)
    return await Promise.resolve({ rows: answer(compiledQuery.sql) as R[] })
  },
  async *streamQuery<R>(
    compiledQuery: CompiledQuery,
  ): AsyncIterableIterator<QueryResult<R>> {
    recordQuery(sink, compiledQuery)
    yield await Promise.resolve({ rows: answer(compiledQuery.sql) as R[] })
  },
})
