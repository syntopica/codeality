/** A resolved database to connect to: the full url for `psql`, the host name alone for anything written to disk, and the password when it came from the environment rather than the url. */
export type PostgresTarget = { url: string; host: string; password?: string }
