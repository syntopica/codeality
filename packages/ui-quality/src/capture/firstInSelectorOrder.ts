import type { Locator, Page } from 'playwright'

import { selectorAlternatives } from '@/capture/selectorAlternatives.js'

/**
 * The first visible element of the first alternative that has one. A
 * selector list matches in DOM order, so `.first()` on the default username
 * list took an off-screen spam-trap `<input type="text">` that sat before the
 * real email field: login filled the honeypot and never navigated.
 */
export const firstInSelectorOrder = async (
  page: Page,
  selector: string,
): Promise<Locator> => {
  for (const alternative of selectorAlternatives(selector)) {
    const candidate = page
      .locator(alternative)
      .filter({ visible: true })
      .first()
    if ((await candidate.count()) > 0) return candidate
  }
  return page.locator(selector).first()
}
