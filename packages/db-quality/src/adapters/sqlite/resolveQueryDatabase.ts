import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

/** The configured database as an absolute path: `~/` is the home directory, anything else is relative to the root. */
export const resolveQueryDatabase = (root: string, database: string): string =>
  database.startsWith('~/')
    ? join(homedir(), database.slice(2))
    : resolve(root, database)
