import type { KyselyStatement } from '@/adapters/kysely/KyselyStatement.js'
import { sqliteLiteral } from '@/adapters/kysely/sqliteLiteral.js'
import { quotedSpanEnd } from '@/sql/quotedSpanEnd.js'

// The sqlite3 shell cannot bind Kysely's anonymous `?` placeholders, so each
// is replaced by its value as a literal; a `?` inside a string or a quoted
// identifier is left alone.
/** The statement's SQL with every `?` placeholder replaced by its parameter. */
export const inlinedSqliteStatement = (statement: KyselyStatement): string => {
  const { sql, parameters } = statement
  let out = ''
  let next = 0
  let index = 0
  while (index < sql.length) {
    const quoted = quotedSpanEnd(sql, index)
    if (quoted === undefined) {
      const char = sql.charAt(index)
      out += char === '?' ? sqliteLiteral(parameters[next++]) : char
      index += 1
    } else {
      out += sql.slice(index, quoted)
      index = quoted
    }
  }
  return out
}
