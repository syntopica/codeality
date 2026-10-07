import type { Kysely } from 'kysely'
import type { Migration } from 'kysely/migration'

// Clean on every dialect: bigint key, text columns, idempotent create.
const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable('account')
    .ifNotExists()
    .addColumn('id', 'bigint', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.notNull())
    .execute()
}

const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable('account').ifExists().execute()
}

export const account: Migration = { up, down }
