import type { Kysely } from 'kysely'

/** A migration's `up` or `down`, as Kysely's `Migration` interface declares it. */
export type MigrationStep = (db: Kysely<unknown>) => Promise<void>
