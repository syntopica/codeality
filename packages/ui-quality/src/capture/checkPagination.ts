import type { Locator, Page } from 'playwright'

import { paginationFailureOf } from '@/behaviour/paginationFailureOf.js'
import { unpagedFailureOf } from '@/behaviour/unpagedFailureOf.js'
import { hasPageControl } from '@/capture/hasPageControl.js'
import { MAX_UNPAGED_ROWS } from '@/capture/MAX_UNPAGED_ROWS.js'
import { NEXT_PAGE_NAME } from '@/capture/NEXT_PAGE_NAME.js'
import { pageControlOf } from '@/capture/pageControlOf.js'
import { PREVIOUS_PAGE_NAME } from '@/capture/PREVIOUS_PAGE_NAME.js'
import { rowsAfterClick } from '@/capture/rowsAfterClick.js'
import { tableRowTexts } from '@/capture/tableRowTexts.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Pages the main table forward once and back once when it offers a pager,
 * and counts its rows when it offers none.
 */
export const checkPagination = async (
  page: Page,
  main: string,
  table: Locator,
): Promise<BehaviourFailure[]> => {
  const next = await pageControlOf(page, main, NEXT_PAGE_NAME)
  if (!next) {
    const failure = unpagedFailureOf(
      await table.locator('tbody tr').count(),
      await hasPageControl(page, main),
      MAX_UNPAGED_ROWS,
    )
    return failure ? [failure] : []
  }
  const first = await tableRowTexts(table)
  const second = await rowsAfterClick(page, next, table)
  const previous = await pageControlOf(page, main, PREVIOUS_PAGE_NAME)
  const back = previous ? await rowsAfterClick(page, previous, table) : null
  const failure = paginationFailureOf(first, second, back)
  return failure ? [failure] : []
}
