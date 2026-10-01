import type { Locator, Page } from 'playwright'

import { FILTER_DEBOUNCE_MS } from '@/capture/FILTER_DEBOUNCE_MS.js'
import { settlePage } from '@/capture/settlePage.js'
import { tableRowTexts } from '@/capture/tableRowTexts.js'
import { waitForTableChange } from '@/capture/waitForTableChange.js'

/** Types a query into the search box and reads the rows it leaves. */
export const rowsAfterSearch = async (
  page: Page,
  box: Locator,
  table: Locator,
  query: string,
): Promise<string[]> => {
  const before = await table.locator('tbody').innerText()
  await box.fill(query)
  await page.waitForTimeout(FILTER_DEBOUNCE_MS)
  await settlePage(page)
  await waitForTableChange(page, table, before)
  return await tableRowTexts(table)
}
