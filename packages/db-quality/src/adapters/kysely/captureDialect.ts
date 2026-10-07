import type { Dialect } from 'kysely'

import { captureDriver } from '@/adapters/kysely/captureDriver.js'
import type { KyselyModule } from '@/adapters/kysely/KyselyModule.js'
import type { KyselyStatement } from '@/adapters/kysely/KyselyStatement.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'

// Kysely's documented split between building and running a query: the
// dialect's real adapter, introspector and query compiler, with a driver that
// never reaches a database.
/** A compile-only dialect: real SQL generation, every query captured into `sink`. */
export const captureDialect = (
  kysely: KyselyModule,
  dialect: KyselyDialect,
  sink: KyselyStatement[],
): Dialect => {
  const parts = {
    postgres: [
      kysely.PostgresAdapter,
      kysely.PostgresIntrospector,
      kysely.PostgresQueryCompiler,
    ],
    mysql: [
      kysely.MysqlAdapter,
      kysely.MysqlIntrospector,
      kysely.MysqlQueryCompiler,
    ],
    sqlite: [
      kysely.SqliteAdapter,
      kysely.SqliteIntrospector,
      kysely.SqliteQueryCompiler,
    ],
  } as const
  const [Adapter, Introspector, QueryCompiler] = parts[dialect]
  return {
    createAdapter: () => new Adapter(),
    createDriver: () => captureDriver(sink),
    createIntrospector: (db) => new Introspector(db),
    createQueryCompiler: () => new QueryCompiler(),
  }
}
