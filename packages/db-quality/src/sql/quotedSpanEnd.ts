/**
 * End offset (exclusive) of the string, quoted identifier or dollar-quoted
 * body that starts at `index`, or undefined when nothing quoted starts there.
 * An unterminated span runs to the end of the text.
 */
export const quotedSpanEnd = (
  sql: string,
  index: number,
): number | undefined => {
  const dollar = /^\$[a-z_]*\$/i.exec(sql.slice(index, index + 64))
  if (dollar) {
    const end = sql.indexOf(dollar[0], index + dollar[0].length)
    return end === -1 ? sql.length : end + dollar[0].length
  }
  const quote = sql[index]
  if (quote !== "'" && quote !== '"') return undefined
  const end = sql.indexOf(quote, index + 1)
  return end === -1 ? sql.length : end + 1
}
