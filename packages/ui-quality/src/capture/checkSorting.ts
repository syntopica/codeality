import type { Locator, Page } from 'playwright'

import { sortFailureOf } from '@/behaviour/sortFailureOf.js'
import { MAX_SORT_HEADERS } from '@/capture/MAX_SORT_HEADERS.js'
import { orderAfterClick } from '@/capture/orderAfterClick.js'
import { sortTargetOf } from '@/capture/sortTargetOf.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/** Sorts by every sortable header in turn and checks the column follows. */
export const checkSorting = async (
  page: Page,
  table: Locator,
): Promise<BehaviourFailure[]> => {
  const failures: BehaviourFailure[] = []
  const headers = table.locator('thead th')
  const count = Math.min(await headers.count(), MAX_SORT_HEADERS)
  for (let index = 0; index < count; index += 1) {
    const header = headers.nth(index)
    const target = await sortTargetOf(header)
    if (!target) continue
    const label = (await header.innerText()).replace(/\s+/g, ' ').trim()
    const first = await orderAfterClick(page, table, target, index)
    const second = await orderAfterClick(page, table, target, index)
    const failure = sortFailureOf(label, first, second)
    if (failure) failures.push(failure)
  }
  return failures
}
