import type { Page } from 'playwright'

import { ANIMATIONS_SETTLED } from '@/capture/ANIMATIONS_SETTLED.js'
import { SETTLE_TIMEOUT_MS } from '@/capture/SETTLE_TIMEOUT_MS.js'

/** Lets a page finish what an interaction started: its network, then its transitions. */
export const settlePage = async (page: Page): Promise<void> => {
  await page
    .waitForLoadState('networkidle', { timeout: SETTLE_TIMEOUT_MS })
    .catch(() => undefined)
  await page.evaluate(ANIMATIONS_SETTLED)
}
