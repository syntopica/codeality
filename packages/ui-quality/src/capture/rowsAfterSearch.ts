import type { Locator, Page } from 'playwright'

import { FILTER_DEBOUNCE_MS } from '@/capture/FILTER_DEBOUNCE_MS.js'
import { tableChangeAfter } from '@/capture/tableChangeAfter.js'
import { tableRowTexts } from '@/capture/tableRowTexts.js'

/** Types a query into the search box and reads the rows it leaves. */
export const rowsAfterSearch = async (
  page: Page,
  box: Locator,
  table: Locator,
  query: string,
): Promise<string[]> => {
  await tableChangeAfter(page, table, async () => {
    await box.fill(query)
    await page.waitForTimeout(FILTER_DEBOUNCE_MS)
  })
  return await tableRowTexts(table)
}
