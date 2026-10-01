import type { Page } from 'playwright'

/**
 * Whether a modal has taken the main region away from its reader: a dialog
 * library hides everything behind it with `aria-hidden` or `inert`, and what
 * is behind cannot be used until it closes.
 */
export const mainIsCovered = async (
  page: Page,
  main: string,
): Promise<boolean> =>
  (await page.evaluate(
    `document.querySelector(${JSON.stringify(main)})?.closest('[aria-hidden="true"], [inert]') != null`,
  )) === true
