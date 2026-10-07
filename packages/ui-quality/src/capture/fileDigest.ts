import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

/** The SHA-256 of a file's bytes, hex encoded. */
export const fileDigest = (path: string): string =>
  createHash('sha256').update(readFileSync(path)).digest('hex')
