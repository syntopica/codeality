import type { Locator, Page } from 'playwright'

import { MIN_TABLE_ROWS } from '@/capture/MIN_TABLE_ROWS.js'

/** The first visible table in the main region with enough rows to exercise. */
export const firstDataTable = async (
  page: Page,
  main: string,
): Promise<Locator | null> => {
  const tables = page.locator(`${main} table:visible`)
  const count = await tables.count()
  for (let index = 0; index < count; index += 1) {
    const table = tables.nth(index)
    if ((await table.locator('tbody tr').count()) >= MIN_TABLE_ROWS)
      return table
  }
  return null
}
