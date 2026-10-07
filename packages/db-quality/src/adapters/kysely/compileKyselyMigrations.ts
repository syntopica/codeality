import { join } from 'node:path'

import { createJiti } from 'jiti'

import type { CompiledMigration } from '@/adapters/kysely/CompiledMigration.js'
import { compileOnDialect } from '@/adapters/kysely/compileOnDialect.js'
import type { DialectCompilation } from '@/adapters/kysely/DialectCompilation.js'
import type { KyselyCompileRequest } from '@/adapters/kysely/KyselyCompileRequest.js'
import { loadKyselyModule } from '@/adapters/kysely/loadKyselyModule.js'
import { loadMigrations } from '@/adapters/kysely/loadMigrations.js'
import { projectTsconfigPaths } from '@/adapters/kysely/projectTsconfigPaths.js'

// jiti runs the project's TypeScript as written, resolving `kysely` and every
// other import from the project, path aliases from its tsconfig.json included.
// `fsCache: false` keeps it from writing a transpile cache under node_modules:
// `check` never writes.
/** Loads the project's migrations and compiles each on every requested dialect, nothing executed. */
export const compileKyselyMigrations = async (
  request: KyselyCompileRequest,
): Promise<CompiledMigration[]> => {
  const jiti = createJiti(join(request.root, 'codeality-db.json'), {
    fsCache: false,
    interopDefault: false,
    tsconfigPaths: projectTsconfigPaths(request.root),
  })
  const kysely = await loadKyselyModule(jiti, request.root)
  const migrations = await loadMigrations(jiti, request)
  const compiled = new Map<string, DialectCompilation[]>()
  for (const dialect of request.dialects)
    compiled.set(dialect, await compileOnDialect(kysely, migrations, dialect))
  return migrations.map((migration, index) => ({
    name: migration.name,
    path: migration.path,
    hasDown: migration.down !== undefined,
    dialects: Object.fromEntries(
      request.dialects.map((dialect) => [
        dialect,
        compiled.get(dialect)?.[index],
      ]),
    ),
  }))
}
