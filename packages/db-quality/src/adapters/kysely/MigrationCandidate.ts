/** A loaded value before it is known to be a Kysely `Migration`. */
export type MigrationCandidate = { up?: unknown; down?: unknown }
