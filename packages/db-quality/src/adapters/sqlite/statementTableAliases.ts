import { ALIAS_KEYWORDS } from '@/adapters/sqlite/ALIAS_KEYWORDS.js'

// The prefix is a lookbehind: `SELECT a, b FROM jobs j` must not let the
// comma branch consume the FROM that introduces the real table.
/** Alias to table, lower-cased, for every `FROM`/`JOIN`/comma `<table> [AS] <alias>` naming a known table. */
export const statementTableAliases = (
  text: string,
  tables: Map<string, string>,
): Map<string, string> => {
  const aliases = new Map<string, string>()
  const pattern =
    /(?<=\b(?:from|join|update|into)\s+|,\s*)"?(?<table>\w+)"?(?:\s+as)?\s+"?(?<alias>\w+)"?/gi
  for (const match of text.matchAll(pattern)) {
    const table = tables.get(match.groups?.['table']?.toLowerCase() ?? '')
    const alias = match.groups?.['alias']?.toLowerCase() ?? ''
    if (table !== undefined && !ALIAS_KEYWORDS.has(alias))
      aliases.set(alias, table)
  }
  return aliases
}
