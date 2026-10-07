import type * as Kysely from 'kysely'

/** The consumer's own `kysely`, loaded at run time; this package only borrows its types. */
export type KyselyModule = typeof Kysely
