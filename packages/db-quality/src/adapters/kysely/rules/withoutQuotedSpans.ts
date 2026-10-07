/** The SQL with every string and quoted identifier ('...', "...", `...`) blanked to one space. */
export const withoutQuotedSpans = (sql: string): string =>
  sql.replaceAll(/'(?:[^']|'')*'|"(?:[^"]|"")*"|`(?:[^`]|``)*`/g, ' ')
