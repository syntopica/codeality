import type { Page } from 'playwright'

import { CHANGE_TIMEOUT_MS } from '@/capture/CHANGE_TIMEOUT_MS.js'
import { collectionItems } from '@/capture/collectionItems.js'
import { STABLE_INTERVAL_MS } from '@/capture/STABLE_INTERVAL_MS.js'

/**
 * Waits until the main collection shows items other than `before` and then
 * holds still, or until the timeout, and returns what it settled on: a pager
 * that changes nothing is judged on what it left. A read that finds nothing,
 * as one mid-navigation does, never counts as settled.
 */
export const waitForItemsChange = async (
  page: Page,
  main: string,
  before: string,
): Promise<string[]> => {
  const deadline = Date.now() + CHANGE_TIMEOUT_MS
  let previous = before
  while (Date.now() < deadline) {
    await page.waitForTimeout(STABLE_INTERVAL_MS)
    const items = await collectionItems(page, main)
    const current = items.join('\n')
    if (items.length > 0 && current !== before && current === previous)
      return items
    previous = current
  }
  return await collectionItems(page, main)
}
