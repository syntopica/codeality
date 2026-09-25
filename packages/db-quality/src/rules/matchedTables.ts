import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import type { StatementRef } from '@/rules/StatementRef.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import { qualifiedName } from '@/sql/qualifiedName.js'

/** Qualified names captured by group 1 of `pattern`, each mapped to its first statement. */
export const matchedTables = (
  set: MigrationFile[],
  pattern: RegExp,
): Map<string, StatementRef> => {
  const tables = new Map<string, StatementRef>()
  for (const file of set)
    for (const statement of file.statements) {
      const match = pattern.exec(normalizeSqlText(statement.text))
      if (!match?.[1]) continue
      const name = qualifiedName(match[1])
      if (!tables.has(name)) tables.set(name, { file, statement })
    }
  return tables
}
