import { readFileSync } from 'node:fs'
import { join, matchesGlob } from 'node:path'

import { isQueryStatement } from '@/adapters/sqlite/isQueryStatement.js'
import { queryFilesUnder } from '@/adapters/sqlite/queryFilesUnder.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import { splitSqlStatements } from '@/sql/splitSqlStatements.js'

/** The query statements of every `.sql` file under the configured directories, less the excluded ones. */
export const readQueryFiles = (
  root: string,
  paths: string[],
  exclude: string[],
): MigrationFile[] =>
  queryFilesUnder(root, paths)
    .filter((path) => !exclude.some((glob) => matchesGlob(path, glob)))
    .map((path) => ({
      path,
      statements: splitSqlStatements(
        readFileSync(join(root, path), 'utf8'),
      ).filter(isQueryStatement),
    }))
