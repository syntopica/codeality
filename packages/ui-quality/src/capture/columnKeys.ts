import type { Locator } from 'playwright'

import type { SortKey } from '@/behaviour/SortKey.js'
import { sortKeyOf } from '@/behaviour/sortKeyOf.js'
import { cellSortTexts } from '@/capture/cellSortTexts.js'

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
      .evaluateAll(cellSortTexts)
  ).map(sortKeyOf)
