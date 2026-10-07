import type { Page } from 'playwright'

import { FOCUS_READ_SCRIPT } from '@/capture/FOCUS_READ_SCRIPT.js'
import { FOCUS_SETUP_SCRIPT } from '@/capture/FOCUS_SETUP_SCRIPT.js'
import { MAX_FOCUS_STOPS } from '@/capture/MAX_FOCUS_STOPS.js'
import type { FocusStop } from '@/model/FocusStop.js'

/**
 * Presses Tab up to 30 times, as a keyboard user would, and reports for each
 * element reached whether it looked any different focused. Stops when focus
 * comes back round to an element already seen. Run after the probe, which
 * leaves its element ids on the page.
 */
export const tabThroughPage = async (page: Page): Promise<FocusStop[]> => {
  await page.mouse.move(0, 0)
  await page.evaluate(FOCUS_SETUP_SCRIPT)
  const stops = new Map<number, FocusStop>()
  for (let press = 0; press < MAX_FOCUS_STOPS; press++) {
    await page.keyboard.press('Tab')
    const stop: FocusStop | null = await page.evaluate(FOCUS_READ_SCRIPT)
    if (stop && stops.has(stop.element)) break
    if (stop) stops.set(stop.element, stop)
  }
  return [...stops.values()]
}
