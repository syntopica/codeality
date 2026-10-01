import type { Locator, Page } from 'playwright'

import { emptyStateFailureOf } from '@/behaviour/emptyStateFailureOf.js'
import { newLinesOf } from '@/behaviour/newLinesOf.js'
import { NO_MATCH_QUERY } from '@/capture/NO_MATCH_QUERY.js'
import { rowsAfterSearch } from '@/capture/rowsAfterSearch.js'
import { searchBoxOf } from '@/capture/searchBoxOf.js'
import { visibleTextLines } from '@/capture/visibleTextLines.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Searches for something no row has, reads what the screen says, then clears
 * it whatever happened: an app that remembers its search would otherwise keep
 * showing nothing on every later screen.
 */
export const checkEmptyState = async (
  page: Page,
  main: string,
  table: Locator,
): Promise<BehaviourFailure[]> => {
  const box = await searchBoxOf(page, main)
  if (!box) return []
  const before = await visibleTextLines(page)
  try {
    const rows = await rowsAfterSearch(page, box, table, NO_MATCH_QUERY)
    const after = await visibleTextLines(page)
    const failure = emptyStateFailureOf(
      rows,
      newLinesOf(before, after, NO_MATCH_QUERY),
    )
    return failure ? [failure] : []
  } finally {
    await rowsAfterSearch(page, box, table, '')
  }
}
