import type { Kysely } from 'kysely'

const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable('first')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .execute()
}

export default { up }
