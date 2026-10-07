import type { Page } from 'playwright'

import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { SCROLL_TO_BOTTOM } from '@/capture/SCROLL_TO_BOTTOM.js'

/** Scrolls to the end of the page, or brings the first match of a selector into view. */
export const scrollRoute = async (
  page: Page,
  target: string,
): Promise<void> => {
  if (target === SCROLL_TO_BOTTOM) {
    await page.evaluate(
      'window.scrollTo(0, document.documentElement.scrollHeight)',
    )
    return
  }
  await page
    .locator(target)
    .first()
    .scrollIntoViewIfNeeded({ timeout: CLICK_TIMEOUT_MS })
}
