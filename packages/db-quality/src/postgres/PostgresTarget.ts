/** A resolved database to connect to: the url for `psql` with no password in it, the host name alone for anything written to disk, and the password, which only ever travels through PGPASSWORD. */
export type PostgresTarget = { url: string; host: string; password?: string }
