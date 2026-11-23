import type { Locator, Page } from 'playwright'

import { CHANGE_TIMEOUT_MS } from '@/capture/CHANGE_TIMEOUT_MS.js'
import type { PendingDataRequests } from '@/capture/PendingDataRequests.js'
import { STABLE_INTERVAL_MS } from '@/capture/STABLE_INTERVAL_MS.js'

/**
 * Waits until the table body shows something other than `before`, holds
 * still and has no request of the interaction left open, or until the
 * timeout: a control that changes nothing is judged on what it left. Rows
 * that changed while a request is still open are a state on the way, a
 * loading placeholder or an optimistic guess, not the result. False when the
 * timeout came with a request still open: what the table shows then is not
 * known to be the result.
 */
export const waitForTableChange = async (
  page: Page,
  table: Locator,
  before: string,
  requests: PendingDataRequests,
): Promise<boolean> => {
  // A grouped list is several tables, so their bodies are read together.
  const body = table.locator('tbody')
  const deadline = Date.now() + CHANGE_TIMEOUT_MS
  let previous = before
  while (Date.now() < deadline) {
    await page.waitForTimeout(STABLE_INTERVAL_MS)
    const current = await body
      .allInnerTexts()
      .then((texts) => texts.join('\n'))
      .catch(() => previous)
    if (current !== before && current === previous && requests.size === 0)
      return true
    previous = current
  }
  return requests.size === 0
}
