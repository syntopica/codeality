/** How many times each baseline entry was recorded. */
export const countEntries = (entries: string[]): Map<string, number> => {
  const counts = new Map<string, number>()
  for (const entry of entries) counts.set(entry, (counts.get(entry) ?? 0) + 1)
  return counts
}
