import type { Page } from 'playwright'

import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { SETTLE_TIMEOUT_MS } from '@/capture/SETTLE_TIMEOUT_MS.js'

/**
 * Clicks each selector in order, letting the page settle after each one. A
 * target that never appears stops the sequence and is returned as a failure
 * rather than thrown: one missing tab must not cost the rest of the run.
 */
export const clickThrough = async (
  page: Page,
  selectors: string[],
): Promise<string[]> => {
  for (const selector of selectors) {
    try {
      await page.locator(selector).first().click({ timeout: CLICK_TIMEOUT_MS })
    } catch {
      return [selector]
    }
    await page
      .waitForLoadState('networkidle', { timeout: SETTLE_TIMEOUT_MS })
      .catch(() => undefined)
  }
  return []
}
