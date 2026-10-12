import type { Page } from 'playwright'

import { OPEN_DIALOG } from '@/capture/OPEN_DIALOG.js'

/** Whether a dialog or drawer still shows. */
export const dialogIsOpen = async (page: Page): Promise<boolean> =>
  (await page.evaluate(
    `[...document.querySelectorAll(${JSON.stringify(OPEN_DIALOG)})].some((e) => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))`,
  )) === true
