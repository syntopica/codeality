import { resolve } from 'node:path'

import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import { migrationLine } from '@/adapters/kysely/migrationLine.js'
import { runKyselyCompile } from '@/adapters/kysely/runKyselyCompile.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'
import type { KyselyMigrationsConfig } from '@/config/KyselyMigrationsConfig.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** The configured migrations compiled on the dialects, each with the line that declares it. */
export const locatedMigrations = (
  runner: CommandRunner,
  root: string,
  config: KyselyMigrationsConfig,
  dialects: KyselyDialect[],
): LocatedMigration[] =>
  runKyselyCompile(runner, {
    root: resolve(root),
    ...(config.module === undefined ? {} : { module: config.module }),
    ...(config.folder === undefined ? {} : { folder: config.folder }),
    export: config.export,
    dialects,
  }).map((migration) => ({
    ...migration,
    line: migrationLine(root, migration.path, migration.name),
  }))
