import type { Page } from 'playwright'

import { newLinesOf } from '@/behaviour/newLinesOf.js'
import { CHANGE_TIMEOUT_MS } from '@/capture/CHANGE_TIMEOUT_MS.js'
import { feedbackCount } from '@/capture/feedbackCount.js'
import type { FeedbackSnapshot } from '@/capture/FeedbackSnapshot.js'
import { STABLE_INTERVAL_MS } from '@/capture/STABLE_INTERVAL_MS.js'
import { visibleTextLines } from '@/capture/visibleTextLines.js'

/**
 * Whether the page told the user anything after an action: new text, a new
 * alert or invalid field, or a different address. Polled, since a toast can
 * arrive after the failed request settles.
 */
export const sawFeedback = async (
  page: Page,
  before: FeedbackSnapshot,
): Promise<boolean> => {
  const deadline = Date.now() + CHANGE_TIMEOUT_MS
  while (Date.now() < deadline) {
    await page.waitForTimeout(STABLE_INTERVAL_MS)
    if (page.url() !== before.url) return true
    if ((await feedbackCount(page)) > before.feedback) return true
    const lines = await visibleTextLines(page)
    if (newLinesOf(before.lines, lines, '').length > 0) return true
  }
  return false
}
