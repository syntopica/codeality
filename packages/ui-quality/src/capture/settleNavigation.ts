import type { Page } from 'playwright'

import { SETTLE_TIMEOUT_MS } from '@/capture/SETTLE_TIMEOUT_MS.js'

/** Bound load and network settling together when a page keeps resources open. */
export const settleNavigation = async (page: Page): Promise<void> => {
  await Promise.all(
    (['load', 'networkidle'] as const).map(async (state) =>
      page
        .waitForLoadState(state, { timeout: SETTLE_TIMEOUT_MS })
        .catch(() => undefined),
    ),
  )
}
