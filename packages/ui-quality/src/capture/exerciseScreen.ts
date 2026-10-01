import type { Page } from 'playwright'

import { checkEmptyState } from '@/capture/checkEmptyState.js'
import { checkFiltering } from '@/capture/checkFiltering.js'
import { checkPagination } from '@/capture/checkPagination.js'
import { checkSorting } from '@/capture/checkSorting.js'
import { firstDataTable } from '@/capture/firstDataTable.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Uses the main table the way its reader would: searches it, searches for
 * nothing, pages it, then sorts it by each column. Runs after the screen is
 * measured, since all of it changes what it shows. A control that cannot be
 * operated at all (covered by a drawer, detached by a re-render) is skipped
 * rather than reported: the click rules already own that failure.
 */
export const exerciseScreen = async (
  page: Page,
  main: string,
): Promise<BehaviourFailure[]> => {
  const table = await firstDataTable(page, main)
  const failures: BehaviourFailure[] = []
  if (!table) return failures
  failures.push(...(await checkFiltering(page, main, table).catch(() => [])))
  failures.push(...(await checkEmptyState(page, main, table).catch(() => [])))
  failures.push(...(await checkPagination(page, main, table).catch(() => [])))
  failures.push(...(await checkSorting(page, table).catch(() => [])))
  return failures
}
