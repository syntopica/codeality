import type { Locator, Page } from 'playwright'

import { PendingDataRequests } from '@/capture/PendingDataRequests.js'
import { settlePage } from '@/capture/settlePage.js'
import { waitForTableChange } from '@/capture/waitForTableChange.js'

/**
 * Operates a control and waits for the table to show what it did. The
 * requests are watched from before the control is touched, so the one it
 * sends is seen. False when the table cannot be known to show the result.
 * The table may be gone, replaced by an empty state, so its text is read as
 * empty rather than waited for.
 */
export const tableChangeAfter = async (
  page: Page,
  table: Locator,
  operate: () => Promise<void>,
): Promise<boolean> => {
  const before = await table
    .locator('tbody')
    .allInnerTexts()
    .then((texts) => texts.join('\n'))
    .catch(() => '')
  const requests = new PendingDataRequests(page)
  try {
    await operate()
    await settlePage(page)
    return await waitForTableChange(page, table, before, requests)
  } finally {
    requests.dispose()
  }
}
