import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { MigrationFile } from '@/sql/MigrationFile.js'
import { splitSqlStatements } from '@/sql/splitSqlStatements.js'

export const readMigrationSet = (
  root: string,
  migrationsDir: string,
): MigrationFile[] =>
  readdirSync(join(root, migrationsDir))
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => ({
      path: `${migrationsDir.replaceAll('\\', '/')}/${name}`,
      statements: splitSqlStatements(
        readFileSync(join(root, migrationsDir, name), 'utf8'),
      ),
    }))
