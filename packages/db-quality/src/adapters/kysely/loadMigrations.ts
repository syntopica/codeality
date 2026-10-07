import { existsSync } from 'node:fs'
import { join } from 'node:path'

import type { JitiLoader } from '@/adapters/kysely/JitiLoader.js'
import type { KyselyCompileRequest } from '@/adapters/kysely/KyselyCompileRequest.js'
import type { LoadedMigration } from '@/adapters/kysely/LoadedMigration.js'
import { loadFolderMigrations } from '@/adapters/kysely/loadFolderMigrations.js'
import { loadModuleMigrations } from '@/adapters/kysely/loadModuleMigrations.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** The configured module's or folder's migrations; ConfigError when the path is missing. */
export const loadMigrations = async (
  jiti: JitiLoader,
  request: KyselyCompileRequest,
): Promise<LoadedMigration[]> => {
  const source = request.module ?? request.folder ?? ''
  if (!existsSync(join(request.root, source)))
    throw new ConfigError(`kysely.migrations: "${source}" does not exist`)
  return request.module === undefined
    ? await loadFolderMigrations(jiti, request.root, source)
    : await loadModuleMigrations(jiti, request.root, source, request.export)
}
