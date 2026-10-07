/** The quote a selector is inside after `character`, or null outside one. */
export const nextQuote = (
  quote: string | null,
  character: string,
): string | null => {
  if (quote !== null) return character === quote ? null : quote
  return character === '"' || character === "'" ? character : null
}
