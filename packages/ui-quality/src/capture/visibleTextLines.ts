import type { Page } from 'playwright'

/** Every non-empty line of text the page shows, to tell what appeared. */
export const visibleTextLines = async (page: Page): Promise<string[]> =>
  (await page.locator('body').innerText())
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
