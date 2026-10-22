import { explicitNumericSortKey } from '@/behaviour/explicitNumericSortKey.js'
import type { SortKey } from '@/behaviour/SortKey.js'
import { sortKeyOf } from '@/behaviour/sortKeyOf.js'
import type { CellSortReading } from '@/capture/CellSortReading.js'

/** Prefer one valid opt-in number; preserve the existing fallback otherwise. */
export const sortKeyFromReading = (reading: CellSortReading): SortKey =>
  explicitNumericSortKey(
    reading.declaration?.type ?? null,
    reading.declaration?.value ?? null,
  ) ?? sortKeyOf(reading.text)
