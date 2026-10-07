import { join } from 'node:path'

import { isDirectory } from '@/config/isDirectory.js'
import type { KyselyConfig } from '@/config/KyselyConfig.js'
import { kyselyMigrationModules } from '@/config/kyselyMigrationModules.js'
import { manifestDependencies } from '@/config/manifestDependencies.js'

// A migrations module is proposed only when exactly one candidate exists:
// two would be a guess, and `init` says so instead (kyselyMigrationsNote).
/** The `kysely` section init proposes, or undefined when kysely is not a dependency. */
export const detectKysely = (root: string): KyselyConfig | undefined => {
  if (!('kysely' in manifestDependencies(root))) return undefined
  const roots = ['src', 'server', 'app', 'lib', 'db'].filter((name) =>
    isDirectory(join(root, name)),
  )
  const modules = kyselyMigrationModules(root, roots)
  const module = modules.length === 1 ? modules[0] : undefined
  return {
    roots,
    objectNames: ['db', 'trx'],
    ...(module === undefined
      ? {}
      : {
          migrations: {
            module,
            // A file is named after what it exports (`migrationList.ts`
            // exports `migrationList`); an index exports the default name.
            export: module.endsWith('/migrationList.ts')
              ? 'migrationList'
              : 'migrations',
            moneyColumns: false,
          },
        }),
  }
}
