import type { ScanKind } from '@/adapters/sqlite/ScanKind.js'

/** A `SCAN` row of a plan: the name it shows (a table, an alias or a CTE) and what it reads. */
export type PlanScan = { name: string; kind: ScanKind; detail: string }
