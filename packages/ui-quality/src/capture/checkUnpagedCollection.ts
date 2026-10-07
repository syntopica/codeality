import type { Page } from 'playwright'

import { unpagedFailureOf } from '@/behaviour/unpagedFailureOf.js'
import { hasPageControl } from '@/capture/hasPageControl.js'
import { MAX_UNPAGED_ITEMS } from '@/capture/MAX_UNPAGED_ITEMS.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/** Counts the items of a repeated list that offers no "next" control to follow. */
export const checkUnpagedCollection = async (
  page: Page,
  main: string,
  items: number,
): Promise<BehaviourFailure[]> => {
  const failure = unpagedFailureOf(
    items,
    await hasPageControl(page, main),
    MAX_UNPAGED_ITEMS,
    'list',
  )
  return failure ? [failure] : []
}
