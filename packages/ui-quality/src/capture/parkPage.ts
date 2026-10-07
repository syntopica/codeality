import type { Page } from 'playwright'

/**
 * Leaves a page on about:blank after a failed navigation. Chromium follows the
 * failure with a navigation of its own to an error page, which interrupts the
 * first `goto` that comes after - including this one - so it is tried until a
 * blank page actually commits.
 */
export const parkPage = async (page: Page): Promise<void> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parked = await page
      .goto('about:blank')
      .then(() => true)
      .catch(() => false)
    if (parked && page.url() === 'about:blank') return
    await page.waitForLoadState('load').catch(() => undefined)
  }
}
