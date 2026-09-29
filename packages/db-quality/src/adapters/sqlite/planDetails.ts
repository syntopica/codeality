import type { PlanRow } from '@/adapters/sqlite/PlanRow.js'

// The sqlite3 shell draws EXPLAIN QUERY PLAN as a tree whatever the output
// mode (`QUERY PLAN`, then `|--SCAN t`, `|  `--SEARCH u ...`); JSON rows are
// read too, in case a shell ever prints them.
/** The detail text of every plan row, tree drawing removed. */
export const planDetails = (output: string): string[] => {
  const text = output.trim()
  if (text.startsWith('['))
    return (JSON.parse(text) as PlanRow[]).map((row) => row.detail)
  return text
    .split('\n')
    .map((line) => line.replace(/^[\s|`-]*/, '').trim())
    .filter((line) => line !== '' && line !== 'QUERY PLAN')
}
