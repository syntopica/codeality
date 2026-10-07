import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The 1-based line where the migration's name first appears in its file; 0 when it does not. */
export const migrationLine = (
  root: string,
  path: string,
  name: string,
): number => {
  const index = readFileSync(join(root, path), 'utf8')
    .split('\n')
    .findIndex((line) => line.includes(name))
  return index + 1
}
