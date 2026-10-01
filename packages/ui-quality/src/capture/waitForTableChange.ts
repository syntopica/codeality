import type { Locator, Page } from 'playwright'

import { CHANGE_TIMEOUT_MS } from '@/capture/CHANGE_TIMEOUT_MS.js'
import { STABLE_INTERVAL_MS } from '@/capture/STABLE_INTERVAL_MS.js'

/**
 * Waits until the table body shows something other than `before` and then
 * holds still, or until the timeout: a control that changes nothing is
 * judged on what it left.
 */
export const waitForTableChange = async (
  page: Page,
  table: Locator,
  before: string,
): Promise<void> => {
  const body = table.locator('tbody')
  const deadline = Date.now() + CHANGE_TIMEOUT_MS
  let previous = before
  while (Date.now() < deadline) {
    await page.waitForTimeout(STABLE_INTERVAL_MS)
    const current = await body.innerText().catch(() => previous)
    if (current !== before && current === previous) return
    previous = current
  }
}
