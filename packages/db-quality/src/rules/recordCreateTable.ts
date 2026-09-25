import { CREATE_TABLE_PATTERN } from '@/rules/CREATE_TABLE_PATTERN.js'
import { inlineKeyColumns } from '@/rules/inlineKeyColumns.js'
import type { TableKnowledge } from '@/rules/TableKnowledge.js'
import { qualifiedName } from '@/sql/qualifiedName.js'

/** Records a `create table` statement's inline and table-level key columns; reports whether it matched. */
export const recordCreateTable = (
  text: string,
  entry: (table: string) => TableKnowledge,
): boolean => {
  const match = CREATE_TABLE_PATTERN.exec(text)
  if (!match?.[1] || match[2] === undefined) return false
  const table = entry(qualifiedName(match[1]))
  for (const column of inlineKeyColumns(match[2])) {
    table.indexed.add(column)
    table.unique.add(column)
  }
  return true
}
