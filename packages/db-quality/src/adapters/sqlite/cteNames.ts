/** The lower-cased names a statement's `WITH` clause defines. */
export const cteNames = (text: string): Set<string> =>
  new Set(
    [
      ...text.matchAll(
        /(?:\bwith\s+(?:recursive\s+)?|,\s*)"?(?<name>\w+)"?(?:\s*\([^()]*\))?\s+as\s*(?:not\s+)?(?:materialized\s*)?\(/gi,
      ),
    ].map((match) => (match.groups?.['name'] ?? '').toLowerCase()),
  )
