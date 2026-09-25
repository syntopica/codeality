import type { MigrationFile } from '@/sql/MigrationFile.js'
import type { SqlStatement } from '@/sql/SqlStatement.js'

export const statementAtLine = (
  file: MigrationFile,
  line: number,
): SqlStatement | undefined =>
  [...file.statements].reverse().find((statement) => statement.line <= line)
