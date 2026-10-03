import type { Page } from 'playwright'

import { checkCollectionPagination } from '@/capture/checkCollectionPagination.js'
import { checkEmptyState } from '@/capture/checkEmptyState.js'
import { checkFiltering } from '@/capture/checkFiltering.js'
import { checkPagination } from '@/capture/checkPagination.js'
import { checkSorting } from '@/capture/checkSorting.js'
import { firstDataTable } from '@/capture/firstDataTable.js'
import { listOfTable } from '@/capture/listOfTable.js'
import { mainIsCovered } from '@/capture/mainIsCovered.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Uses the main table the way its reader would: searches it, searches for
 * nothing, pages it, then sorts it by each column. Runs after the screen is
 * measured, since all of it changes what it shows. A control that cannot be
 * operated at all (covered by a drawer, detached by a re-render) is skipped
 * rather than reported: the click rules already own that failure. So is a
 * main region a modal dialog covers. Search and empty results read every
 * table of a grouped list. A main region with no table is paged through
 * its repeated collection, a card grid or a list, instead.
 */
export const exerciseScreen = async (
  page: Page,
  main: string,
): Promise<BehaviourFailure[]> => {
  const failures: BehaviourFailure[] = []
  if (await mainIsCovered(page, main).catch(() => true)) return failures
  const table = await firstDataTable(page, main)
  if (!table) return await checkCollectionPagination(page, main).catch(() => [])
  const list = await listOfTable(page, main, table)
  failures.push(...(await checkFiltering(page, main, list).catch(() => [])))
  failures.push(...(await checkEmptyState(page, main, list).catch(() => [])))
  failures.push(...(await checkPagination(page, main, table).catch(() => [])))
  failures.push(...(await checkSorting(page, table).catch(() => [])))
  return failures
}
