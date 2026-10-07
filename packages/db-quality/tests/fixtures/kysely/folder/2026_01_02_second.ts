import type { Kysely } from 'kysely'

export const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable('first').execute()
}

export const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable('first')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .execute()
}
