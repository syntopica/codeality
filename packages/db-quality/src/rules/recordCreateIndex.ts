import { CREATE_INDEX_PATTERN } from '@/rules/CREATE_INDEX_PATTERN.js'
import { leadingColumn } from '@/rules/leadingColumn.js'
import type { TableKnowledge } from '@/rules/TableKnowledge.js'
import { qualifiedName } from '@/sql/qualifiedName.js'

/** Records a `create index` statement's leading column, as unique when the index is; reports whether it matched. */
export const recordCreateIndex = (
  text: string,
  entry: (table: string) => TableKnowledge,
): boolean => {
  const match = CREATE_INDEX_PATTERN.exec(text)
  if (!match?.[2] || match[3] === undefined) return false
  const column = leadingColumn(match[3])
  if (column === undefined) return true
  const table = entry(qualifiedName(match[2]))
  table.indexed.add(column)
  if (match[1]) table.unique.add(column)
  return true
}
