import type { MigrationFile } from '@/sql/MigrationFile.js'
import type { SqlStatement } from '@/sql/SqlStatement.js'

/** Where a statement lives: the file and the statement itself. */
export type StatementRef = { file: MigrationFile; statement: SqlStatement }
