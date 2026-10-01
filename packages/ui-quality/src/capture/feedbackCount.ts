import type { Page } from 'playwright'

import { FEEDBACK_SELECTOR } from '@/capture/FEEDBACK_SELECTOR.js'

/** How many visible feedback elements the page shows right now. */
export const feedbackCount = async (page: Page): Promise<number> =>
  await page.locator(`${FEEDBACK_SELECTOR} >> visible=true`).count()
