import { existsSync, readFileSync } from 'node:fs'

/** A file's text, or undefined when it does not exist. */
export const readTextFile = (path: string): string | undefined =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined
