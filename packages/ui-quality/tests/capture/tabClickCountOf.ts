import type { Page } from 'playwright'

/** Read the fixture's tab-list click count without duplicating its selectors. */
export const tabClickCountOf = async (page: Page): Promise<string | null> =>
  await page.locator('[role="tablist"]').getAttribute('data-clicks')
