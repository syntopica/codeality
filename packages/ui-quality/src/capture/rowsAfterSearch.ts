import type { Locator, Page } from 'playwright'

import { FILTER_DEBOUNCE_MS } from '@/capture/FILTER_DEBOUNCE_MS.js'
import { settlePage } from '@/capture/settlePage.js'
import { STABLE_INTERVAL_MS } from '@/capture/STABLE_INTERVAL_MS.js'
import { tableRowTexts } from '@/capture/tableRowTexts.js'
import { waitForTableChange } from '@/capture/waitForTableChange.js'

/**
 * Types a query into the search box and reads the rows it leaves. The table
 * may be gone, replaced by an empty state, so its text is read as empty
 * rather than waited for.
 */
export const rowsAfterSearch = async (
  page: Page,
  box: Locator,
  table: Locator,
  query: string,
): Promise<string[]> => {
  const before = await table
    .locator('tbody')
    .innerText({ timeout: STABLE_INTERVAL_MS })
    .catch(() => '')
  await box.fill(query)
  await page.waitForTimeout(FILTER_DEBOUNCE_MS)
  await settlePage(page)
  await waitForTableChange(page, table, before)
  return await tableRowTexts(table)
}
