import { readdirSync } from 'node:fs'
import { extname, join } from 'node:path'

import type { JitiLoader } from '@/adapters/kysely/JitiLoader.js'
import type { LoadedMigration } from '@/adapters/kysely/LoadedMigration.js'
import { MIGRATION_FILE_PATTERN } from '@/adapters/kysely/MIGRATION_FILE_PATTERN.js'
import type { MigrationCandidate } from '@/adapters/kysely/MigrationCandidate.js'
import { migrationFrom } from '@/adapters/kysely/migrationFrom.js'

// FileMigrationProvider's rule: one migration per file, named after the file,
// taken from the default export when it is a migration, else the module.
/** Every migration file in the folder, in name order. */
export const loadFolderMigrations = async (
  jiti: JitiLoader,
  root: string,
  folder: string,
): Promise<LoadedMigration[]> => {
  const files = readdirSync(join(root, folder))
    .filter((file) => MIGRATION_FILE_PATTERN.test(file))
    .sort()
  const migrations: LoadedMigration[] = []
  for (const file of files) {
    const loaded = await jiti.import<Record<string, unknown>>(
      join(root, folder, file),
    )
    const fromDefault = (loaded['default'] ?? {}) as MigrationCandidate
    const path = `${folder.replaceAll('\\', '/')}/${file}`
    migrations.push(
      migrationFrom(
        typeof fromDefault.up === 'function' ? fromDefault : loaded,
        file.slice(0, -extname(file).length),
        path,
      ),
    )
  }
  return migrations
}
