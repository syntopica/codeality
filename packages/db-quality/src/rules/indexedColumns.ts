import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import { createdTables } from '@/rules/createdTables.js'
import { recordAlterKey } from '@/rules/recordAlterKey.js'
import { recordCreateIndex } from '@/rules/recordCreateIndex.js'
import { recordCreateTable } from '@/rules/recordCreateTable.js'
import type { TableKnowledge } from '@/rules/TableKnowledge.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

/** Every table `createdTables` knows, mapped to which of its columns the migrations index or constrain unique. */
export const indexedColumns = (
  set: MigrationFile[],
): Map<string, TableKnowledge> => {
  const knowledge = new Map<string, TableKnowledge>()
  const entry = (table: string): TableKnowledge => {
    const existing = knowledge.get(table)
    if (existing) return existing
    const fresh: TableKnowledge = { indexed: new Set(), unique: new Set() }
    knowledge.set(table, fresh)
    return fresh
  }
  for (const table of createdTables(set).keys()) entry(table)
  for (const file of set)
    for (const statement of file.statements) {
      const text = normalizeSqlText(statement.text)
      if (recordCreateTable(text, entry)) continue
      if (recordCreateIndex(text, entry)) continue
      recordAlterKey(text, entry)
    }
  return knowledge
}
