import type { Page } from 'playwright'

import { NEXT_FRAMES } from '@/capture/NEXT_FRAMES.js'
import { settlePage } from '@/capture/settlePage.js'
import type { InteractionFailure } from '@/model/InteractionFailure.js'

/**
 * Runs one configured interaction and lets the page settle after it. A target
 * that never appears is returned as a failure rather than thrown, so the
 * screen is still measured.
 */
export const attemptInteraction = async (
  page: Page,
  failure: InteractionFailure,
  run: () => Promise<void>,
): Promise<InteractionFailure[]> => {
  try {
    await run()
  } catch {
    return [failure]
  }
  await page.evaluate(NEXT_FRAMES)
  await settlePage(page)
  return []
}
