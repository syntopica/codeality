import type { ScanKind } from '@/adapters/sqlite/ScanKind.js'

/** A plan scan resolved to the real table it reads. */
export type ScannedTable = { table: string; kind: ScanKind; detail: string }
