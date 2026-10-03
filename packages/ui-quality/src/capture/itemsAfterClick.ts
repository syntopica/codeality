import type { Locator, Page } from 'playwright'

import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { collectionItems } from '@/capture/collectionItems.js'
import { settlePage } from '@/capture/settlePage.js'
import { waitForItemsChange } from '@/capture/waitForItemsChange.js'

/**
 * Clicks a pager control and reads the items the collection settles on,
 * whether the click updates the page in place or loads another document.
 */
export const itemsAfterClick = async (
  page: Page,
  main: string,
  control: Locator,
): Promise<string[]> => {
  const before = (await collectionItems(page, main)).join('\n')
  await control.click({ timeout: CLICK_TIMEOUT_MS })
  await page.waitForLoadState('load').catch(() => undefined)
  await settlePage(page).catch(() => undefined)
  return await waitForItemsChange(page, main, before)
}
