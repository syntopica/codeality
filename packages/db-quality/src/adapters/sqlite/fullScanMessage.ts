import type { ScannedTable } from '@/adapters/sqlite/ScannedTable.js'

export const fullScanMessage = (
  scan: ScannedTable,
  rows: number,
  sorts: boolean,
): string => {
  const what = scan.kind === 'table' ? 'full table scan' : 'full index scan'
  const sorted = sorts ? ', then USE TEMP B-TREE FOR ORDER BY' : ''
  const hint =
    scan.kind === 'table'
      ? 'give the filter an index it can use'
      : 'the whole index is read; filter on its leading column or change the join order'
  return `${what} of ${scan.table} (${String(rows)} rows) in the plan the application prepares: ${scan.detail}${sorted}; ${hint}`
}
