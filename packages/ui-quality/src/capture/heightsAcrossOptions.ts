import type { Locator, Page } from 'playwright'

import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { settlePage } from '@/capture/settlePage.js'

/** Presses each of `count` options in turn and reads the bar's height after each. */
export const heightsAcrossOptions = async (
  page: Page,
  options: Locator,
  count: number,
  readHeight: () => Promise<number>,
): Promise<number[]> => {
  const heights: number[] = []
  for (let option = 0; option < count; option += 1) {
    await options.nth(option).click({ timeout: CLICK_TIMEOUT_MS })
    await settlePage(page)
    heights.push(await readHeight())
  }
  return heights
}
