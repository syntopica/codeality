import { join } from 'node:path'

import type { JitiLoader } from '@/adapters/kysely/JitiLoader.js'
import type { LoadedMigration } from '@/adapters/kysely/LoadedMigration.js'
import { migrationFrom } from '@/adapters/kysely/migrationFrom.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** The `Record<string, Migration>` a module exports under `exportName`, in declaration order. */
export const loadModuleMigrations = async (
  jiti: JitiLoader,
  root: string,
  module: string,
  exportName: string,
): Promise<LoadedMigration[]> => {
  const loaded = await jiti.import<Record<string, unknown>>(join(root, module))
  const record = loaded[exportName]
  if (typeof record !== 'object' || record === null || Array.isArray(record))
    throw new ConfigError(
      `kysely.migrations.export: ${module} exports no object named "${exportName}" (it exports: ${Object.keys(loaded).join(', ') || 'nothing'})`,
    )
  return Object.entries(record).map(([name, value]) =>
    migrationFrom(value, name, module.replaceAll('\\', '/')),
  )
}
