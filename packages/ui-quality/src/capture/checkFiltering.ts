import type { Locator, Page } from 'playwright'

import { filterFailureOf } from '@/behaviour/filterFailureOf.js'
import { pickFilterProbe } from '@/behaviour/pickFilterProbe.js'
import { restoreFailureOf } from '@/behaviour/restoreFailureOf.js'
import { rowsAfterSearch } from '@/capture/rowsAfterSearch.js'
import { searchBoxOf } from '@/capture/searchBoxOf.js'
import { tableRowTexts } from '@/capture/tableRowTexts.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Searches for a word one visible row shows, checks the rows that remain,
 * then clears the search and checks the rows come back.
 */
export const checkFiltering = async (
  page: Page,
  main: string,
  table: Locator,
): Promise<BehaviourFailure[]> => {
  const box = await searchBoxOf(page, main)
  if (!box) return []
  const before = await tableRowTexts(table)
  const probe = pickFilterProbe(before)
  if (!probe) return []
  const after = await rowsAfterSearch(page, box, table, probe.token)
  const restored = await rowsAfterSearch(page, box, table, '')
  return [
    filterFailureOf(probe.token, before, after),
    restoreFailureOf(before, restored),
  ].filter((failure): failure is BehaviourFailure => failure !== null)
}
