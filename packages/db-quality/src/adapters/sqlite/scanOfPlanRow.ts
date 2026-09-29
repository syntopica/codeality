import type { PlanScan } from '@/adapters/sqlite/PlanScan.js'

// Current shells print `SCAN j` or `SCAN j USING COVERING INDEX idx`, naming
// the alias; before 3.36 they printed `SCAN TABLE jobs AS j`, naming the
// table. Subqueries, constant rows and virtual tables are not table reads.
/** The scan a plan row describes, or undefined when the row is anything else. */
export const scanOfPlanRow = (detail: string): PlanScan | undefined => {
  const match =
    /^SCAN (?:TABLE )?(?<name>[^\s(]\S*)(?: AS \S+)?(?<rest>(?: .*)?)$/.exec(
      detail,
    )
  const name = match?.groups?.['name']
  const rest = match?.groups?.['rest'] ?? ''
  if (name === undefined || detail === 'SCAN CONSTANT ROW') return undefined
  if (rest.includes('VIRTUAL TABLE')) return undefined
  return {
    name,
    kind: /\bUSING (?:COVERING )?INDEX\b/.test(rest) ? 'index' : 'table',
    detail,
  }
}
