import type { Kysely } from 'kysely'
import type { Migration } from 'kysely/migration'

// A native PostgreSQL enum: not portable, and SQLite has no CREATE TYPE.
const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.createType('mood').asEnum(['happy', 'sad']).execute()
}

const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropType('mood').ifExists().execute()
}

export const moodEnum: Migration = { up, down }
