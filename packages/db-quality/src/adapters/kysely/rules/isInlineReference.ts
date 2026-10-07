import { withoutQuotedSpans } from '@/adapters/kysely/rules/withoutQuotedSpans.js'

// A table-level foreign key reads `foreign key (...) references ...`; any
// `references` beyond those belongs to a column definition.
/** A `create table` or `alter table` statement with a column-level `references`. */
export const isInlineReference = (sql: string): boolean => {
  const text = withoutQuotedSpans(sql).toLowerCase()
  if (!/^\s*(?:create|alter)\s+table\b/.test(text)) return false
  const references = text.match(/\breferences\b/g)?.length ?? 0
  const foreignKeys = text.match(/\bforeign\s+key\b/g)?.length ?? 0
  return references > foreignKeys
}
