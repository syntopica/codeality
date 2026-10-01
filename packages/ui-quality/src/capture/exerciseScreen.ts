import type { Page } from 'playwright'

import { checkFiltering } from '@/capture/checkFiltering.js'
import { checkSorting } from '@/capture/checkSorting.js'
import { firstDataTable } from '@/capture/firstDataTable.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Uses the main table the way its reader would: searches it, then sorts it
 * by each column. Runs after the screen is measured, since both change what
 * it shows. A control that cannot be operated at all (covered by a drawer,
 * detached by a re-render) is skipped rather than reported: the click rules
 * already own that failure.
 */
export const exerciseScreen = async (
  page: Page,
  main: string,
): Promise<BehaviourFailure[]> => {
  const table = await firstDataTable(page, main)
  if (!table) return []
  const filtering = await checkFiltering(page, main, table).catch(() => [])
  const sorting = await checkSorting(page, table).catch(() => [])
  return [...filtering, ...sorting]
}
