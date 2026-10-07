import type { DatabaseConnection, Driver } from 'kysely'

import { captureConnection } from '@/adapters/kysely/captureConnection.js'
import type { KyselyStatement } from '@/adapters/kysely/KyselyStatement.js'

/** A driver with one capturing connection: transactions and lifecycle are no-ops. */
export const captureDriver = (sink: KyselyStatement[]): Driver => {
  const connection = captureConnection(sink)
  const done = async (): Promise<void> => {
    // Nothing to open, commit or close: no database is ever reached.
  }
  return {
    init: done,
    acquireConnection: async (): Promise<DatabaseConnection> =>
      await Promise.resolve(connection),
    beginTransaction: done,
    commitTransaction: done,
    rollbackTransaction: done,
    releaseConnection: done,
    destroy: done,
  }
}
