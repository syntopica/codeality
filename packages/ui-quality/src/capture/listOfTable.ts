import type { Locator, Page } from 'playwright'

import { STABLE_INTERVAL_MS } from '@/capture/STABLE_INTERVAL_MS.js'

/**
 * Every visible table of the main region with the same header as `table`: a
 * list grouped into one table per group is one list to its search, and a
 * filtered row may move to another group's table.
 */
export const listOfTable = async (
  page: Page,
  main: string,
  table: Locator,
): Promise<Locator> => {
  const header = (
    await table
      .locator('thead')
      .innerText({ timeout: STABLE_INTERVAL_MS })
      .catch(() => '')
  ).trim()
  if (header === '') return table
  return page
    .locator(`${main} table:visible`)
    .filter({ has: page.locator('thead', { hasText: header }) })
}
