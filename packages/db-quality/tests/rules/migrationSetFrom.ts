import type { MigrationFile } from '@/sql/MigrationFile.js'
import { splitSqlStatements } from '@/sql/splitSqlStatements.js'

export const migrationSetFrom = (
  files: Record<string, string>,
): MigrationFile[] =>
  Object.entries(files).map(([path, sql]) => ({
    path,
    statements: splitSqlStatements(sql),
  }))
