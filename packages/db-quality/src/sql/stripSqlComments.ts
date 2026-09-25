import { quotedSpanEnd } from '@/sql/quotedSpanEnd.js'

// Comments become nothing but their newlines, so the line numbers of what
// follows are unchanged. Strings, quoted identifiers and dollar-quoted bodies
// are copied through untouched: a `--` inside them is data.
export const stripSqlComments = (sql: string): string => {
  let out = ''
  let index = 0
  while (index < sql.length) {
    const quoted = quotedSpanEnd(sql, index)
    if (quoted !== undefined) {
      out += sql.slice(index, quoted)
      index = quoted
    } else if (sql.startsWith('--', index)) {
      const end = sql.indexOf('\n', index)
      index = end === -1 ? sql.length : end
    } else if (sql.startsWith('/*', index)) {
      const end = sql.indexOf('*/', index + 2)
      const stop = end === -1 ? sql.length : end + 2
      out += sql.slice(index, stop).replaceAll(/[^\n]/g, '')
      index = stop
    } else {
      out += sql.charAt(index)
      index += 1
    }
  }
  return out
}
