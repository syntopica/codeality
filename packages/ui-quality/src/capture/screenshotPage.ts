import { join } from 'node:path'

import type { Page } from 'playwright'

import { screenshotName } from '@/capture/screenshotName.js'
import type { Screen } from '@/model/Screen.js'

/** Captures the whole page from its top once its fonts are in, returning the file. */
export const screenshotPage = async (
  page: Page,
  screensDir: string,
  screen: Screen,
): Promise<string> => {
  // A string, because this package compiles without the DOM library.
  await page.evaluate('document.fonts.ready.then(() => true)')
  // A page that scrolls itself (a chat opening on its last message) would
  // stitch its sticky header into the middle of a full-page capture.
  await page.evaluate('window.scrollTo(0, 0)')
  const screenshot = join(screensDir, screenshotName(screen))
  await page.screenshot({ path: screenshot, fullPage: true })
  return screenshot
}
