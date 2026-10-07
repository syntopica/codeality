import { renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { KYSELY_HASH_FILENAME } from '@/adapters/kysely/KYSELY_HASH_FILENAME.js'
import type { KyselyHashFile } from '@/adapters/kysely/KyselyHashFile.js'

/** Writes the hash file atomically, migrations sorted by name so a diff shows only what changed. */
export const writeKyselyHashFile = (
  root: string,
  file: KyselyHashFile,
): void => {
  const path = join(root, KYSELY_HASH_FILENAME)
  const migrations = Object.fromEntries(
    Object.entries(file.migrations).sort(([a], [b]) => a.localeCompare(b)),
  )
  writeFileSync(
    `${path}.tmp`,
    `${JSON.stringify({ schemaVersion: 1, migrations }, null, 2)}\n`,
  )
  renameSync(`${path}.tmp`, path)
}
