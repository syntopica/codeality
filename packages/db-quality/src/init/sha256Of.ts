import { createHash } from 'node:crypto'

/** The hex SHA-256 digest of a string's exact bytes. */
export const sha256Of = (content: string): string =>
  createHash('sha256').update(content).digest('hex')
