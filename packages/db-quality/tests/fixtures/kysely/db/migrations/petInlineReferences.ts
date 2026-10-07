import type { Kysely } from 'kysely'
import type { Migration } from 'kysely/migration'

// An inline column reference MySQL 8.4 ignores, and money in a float.
const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable('pet')
    .ifNotExists()
    .addColumn('id', 'bigint', (col) => col.primaryKey())
    .addColumn('owner_id', 'bigint', (col) =>
      col.references('account.id').onDelete('cascade'),
    )
    .addColumn('price', 'real')
    .execute()
}

const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable('pet').ifExists().execute()
}

export const petInlineReferences: Migration = { up, down }
