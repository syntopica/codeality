import type { Kysely } from 'kysely'
import type { Migration } from 'kysely/migration'

// No down, and a second table with no primary key.
const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable('note')
    .ifNotExists()
    .addColumn('id', 'bigint', (col) => col.primaryKey())
    .addColumn('body', 'text')
    .execute()
  await db.schema
    .createTable('tag')
    .ifNotExists()
    .addColumn('name', 'text')
    .execute()
}

export const noteWithoutDown: Migration = { up }
