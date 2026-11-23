import type { Locator, Page } from 'playwright'

import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { tableChangeAfter } from '@/capture/tableChangeAfter.js'
import { tableRowTexts } from '@/capture/tableRowTexts.js'

/** Clicks a control and reads the rows the table settles on. */
export const rowsAfterClick = async (
  page: Page,
  control: Locator,
  table: Locator,
): Promise<string[]> => {
  await tableChangeAfter(page, table, async () => {
    await control.click({ timeout: CLICK_TIMEOUT_MS })
  })
  return await tableRowTexts(table)
}
