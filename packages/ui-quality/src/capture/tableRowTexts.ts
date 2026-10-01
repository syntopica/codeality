import type { Locator } from 'playwright'

/** The visible text of every body row. */
export const tableRowTexts = async (table: Locator): Promise<string[]> =>
  await table.locator('tbody tr').allInnerTexts()
