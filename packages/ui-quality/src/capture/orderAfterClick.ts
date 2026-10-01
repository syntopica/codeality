import type { Locator, Page } from 'playwright'

import type { ColumnOrder } from '@/behaviour/ColumnOrder.js'
import { columnOrderOf } from '@/behaviour/columnOrderOf.js'
import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { columnKeys } from '@/capture/columnKeys.js'
import { settlePage } from '@/capture/settlePage.js'
import { waitForTableChange } from '@/capture/waitForTableChange.js'

/** Clicks a sort control and reads how the column runs afterwards. */
export const orderAfterClick = async (
  page: Page,
  table: Locator,
  target: Locator,
  index: number,
): Promise<ColumnOrder> => {
  const before = await table.locator('tbody').innerText()
  await target.click({ timeout: CLICK_TIMEOUT_MS })
  await settlePage(page)
  await waitForTableChange(page, table, before)
  return columnOrderOf(await columnKeys(table, index))
}
