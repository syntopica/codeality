import type { Page } from 'playwright'

import { SETTLE_TIMEOUT_MS } from '@/capture/SETTLE_TIMEOUT_MS.js'

/**
 * Opens a URL and waits for its network to go quiet, but no longer than
 * `SETTLE_TIMEOUT_MS` after the load event: a page holding a request open for
 * good is measured as it stands rather than failing the run.
 */
export const gotoSettled = async (page: Page, url: string): Promise<void> => {
  await page.goto(url, { waitUntil: 'load' })
  await page
    .waitForLoadState('networkidle', { timeout: SETTLE_TIMEOUT_MS })
    .catch(() => undefined)
}
