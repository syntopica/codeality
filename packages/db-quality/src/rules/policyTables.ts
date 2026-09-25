import { policyTable } from '@/rules/policyTable.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

export const policyTables = (set: MigrationFile[]): Set<string> => {
  const tables = new Set<string>()
  for (const file of set)
    for (const statement of file.statements) {
      const table = policyTable(statement)
      if (table) tables.add(table)
    }
  return tables
}
