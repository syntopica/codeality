import type { Locator, Page } from 'playwright'

import type { ColumnOrder } from '@/behaviour/ColumnOrder.js'
import { columnOrderOf } from '@/behaviour/columnOrderOf.js'
import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { columnKeys } from '@/capture/columnKeys.js'
import { tableChangeAfter } from '@/capture/tableChangeAfter.js'

/**
 * Clicks a sort control and reads how the column runs afterwards. Null when
 * the sort was still loading at the deadline: the order on screen is not
 * known to be its result.
 */
export const orderAfterClick = async (
  page: Page,
  table: Locator,
  target: Locator,
  index: number,
): Promise<ColumnOrder | null> => {
  const settled = await tableChangeAfter(page, table, async () => {
    await target.click({ timeout: CLICK_TIMEOUT_MS })
  })
  return settled ? columnOrderOf(await columnKeys(table, index)) : null
}
