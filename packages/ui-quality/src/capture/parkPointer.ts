import type { Page } from 'playwright'

import { NEXT_FRAMES } from '@/capture/NEXT_FRAMES.js'

/**
 * Moves the pointer off the page. A click leaves it resting on what it
 * clicked, and the row under it then paints its hover colours: a shaded row
 * in the screenshot, and hover values in the measurements.
 */
export const parkPointer = async (page: Page): Promise<void> => {
  await page.mouse.move(-1, -1)
  await page.evaluate(NEXT_FRAMES)
}
