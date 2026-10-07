import type { Kysely } from 'kysely'
import type { Migration } from 'kysely/migration'

// SQLite cannot add a constraint to an existing table.
const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .alterTable('account')
    .addUniqueConstraint('account_email_unique', ['email'])
    .execute()
}

const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .alterTable('account')
    .dropConstraint('account_email_unique')
    .execute()
}

export const uniqueEmail: Migration = { up, down }
