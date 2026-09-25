import { quotedSpanEnd } from '@/sql/quotedSpanEnd.js'
import type { SqlStatement } from '@/sql/SqlStatement.js'
import { stripSqlComments } from '@/sql/stripSqlComments.js'

export const splitSqlStatements = (sql: string): SqlStatement[] => {
  const text = stripSqlComments(sql)
  const statements: SqlStatement[] = []
  let start = 0
  const flush = (end: number): void => {
    const raw = text.slice(start, end)
    const leading = raw.length - raw.trimStart().length
    const body = raw.trim()
    if (body) {
      const line =
        1 + (text.slice(0, start + leading).match(/\n/g)?.length ?? 0)
      statements.push({ text: body, line })
    }
    start = end + 1
  }
  let index = 0
  while (index < text.length) {
    const quoted = quotedSpanEnd(text, index)
    if (quoted !== undefined) index = quoted
    else {
      if (text[index] === ';') flush(index)
      index += 1
    }
  }
  flush(text.length)
  return statements
}
