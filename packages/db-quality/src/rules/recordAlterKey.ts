import { ALTER_KEY_PATTERN } from '@/rules/ALTER_KEY_PATTERN.js'
import { leadingColumn } from '@/rules/leadingColumn.js'
import type { TableKnowledge } from '@/rules/TableKnowledge.js'
import { qualifiedName } from '@/sql/qualifiedName.js'

/** Records an `alter table ... add primary key|unique` statement's leading column; reports whether it matched. */
export const recordAlterKey = (
  text: string,
  entry: (table: string) => TableKnowledge,
): boolean => {
  const match = ALTER_KEY_PATTERN.exec(text)
  if (!match?.[1] || match[3] === undefined) return false
  const column = leadingColumn(match[3])
  if (column === undefined) return true
  const table = entry(qualifiedName(match[1]))
  table.indexed.add(column)
  table.unique.add(column)
  return true
}
