/** The lines of `after` that `before` did not show, minus what was typed. */
export const newLinesOf = (
  before: string[],
  after: string[],
  typed: string,
): string[] => {
  const seen = new Set(before)
  return after.filter((line) => !seen.has(line) && line !== typed)
}
