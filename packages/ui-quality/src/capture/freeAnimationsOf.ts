import type { Page } from 'playwright'

import { NEXT_FRAMES } from '@/capture/NEXT_FRAMES.js'
import type { MotionRecord } from '@/model/MotionRecord.js'
import type { ProbeResult } from '@/model/ProbeResult.js'

/**
 * The animations that run when the visitor has not asked for less motion. The
 * screens are captured with reduced motion on, so the page is switched for
 * the read and switched back. Two frames let a stylesheet's media query take
 * effect; the animation list is a state read, so nothing waits on a timer.
 */
export const freeAnimationsOf = async (
  page: Page,
  probe: string,
  mainSelector: string,
): Promise<MotionRecord[]> => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  try {
    await page.evaluate(NEXT_FRAMES)
    const running: number = await page.evaluate(
      'document.getAnimations().length',
    )
    if (running === 0) return []
    const probed: ProbeResult = await page.evaluate(
      `(${probe})(${JSON.stringify(mainSelector)})`,
    )
    return probed.animations
  } finally {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  }
}
