import type { Locator, Page } from 'playwright'

import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { settlePage } from '@/capture/settlePage.js'
import { tableRowTexts } from '@/capture/tableRowTexts.js'
import { waitForTableChange } from '@/capture/waitForTableChange.js'

/** Clicks a control and reads the rows the table settles on. */
export const rowsAfterClick = async (
  page: Page,
  control: Locator,
  table: Locator,
): Promise<string[]> => {
  const before = await table.locator('tbody').innerText()
  await control.click({ timeout: CLICK_TIMEOUT_MS })
  await settlePage(page)
  await waitForTableChange(page, table, before)
  return await tableRowTexts(table)
}
