import type { Locator } from 'playwright'

import type { SortKey } from '@/behaviour/SortKey.js'
import { sortKeyOf } from '@/behaviour/sortKeyOf.js'

/** The sort keys of one column, read from its cells in row order. */
export const columnKeys = async (
  table: Locator,
  index: number,
): Promise<SortKey[]> =>
  (
    await table
      .locator(`tbody tr > :nth-child(${String(index + 1)})`)
      .allInnerTexts()
  ).map(sortKeyOf)
