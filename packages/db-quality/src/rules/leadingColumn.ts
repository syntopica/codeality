/** The first column of a parenthesised column list, or undefined when it is an expression. */
export const leadingColumn = (list: string): string | undefined => {
  const first = list.split(',')[0]?.trim() ?? ''
  const match =
    /^(?:"([^"]+)"|([a-z_][\w$]*))(?:\s+(?:asc|desc|nulls|[a-z_]+_ops)\b.*)?$/i.exec(
      first,
    )
  if (!match) return undefined
  return (match[1] ?? match[2] ?? '').toLowerCase()
}
