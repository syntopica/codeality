import type { Locator } from 'playwright'

import type { SortKey } from '@/behaviour/SortKey.js'
import { cellSortReadings } from '@/capture/cellSortReadings.js'
import { sortKeyFromReading } from '@/capture/sortKeyFromReading.js'

/**
 * The sort keys of one column, read from its cells in row order. A date
 * written in words ("2 jun 2021") is read by its `<time datetime>`.
 */
export const columnKeys = async (
  table: Locator,
  index: number,
): Promise<SortKey[]> =>
  (
    await table
      .locator(`tbody tr > :nth-child(${String(index + 1)})`)
      .evaluateAll(cellSortReadings)
  ).map(sortKeyFromReading)
