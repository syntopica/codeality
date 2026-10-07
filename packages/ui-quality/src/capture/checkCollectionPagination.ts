import type { Page } from 'playwright'

import { collectionPaginationFailureOf } from '@/behaviour/collectionPaginationFailureOf.js'
import { collectionItems } from '@/capture/collectionItems.js'
import { gotoSettled } from '@/capture/gotoSettled.js'
import { isPagerAddress } from '@/capture/isPagerAddress.js'
import { itemsAfterClick } from '@/capture/itemsAfterClick.js'
import { MIN_COLLECTION_ITEMS } from '@/capture/MIN_COLLECTION_ITEMS.js'
import { NEXT_PAGE_NAME } from '@/capture/NEXT_PAGE_NAME.js'
import { pageControlOf } from '@/capture/pageControlOf.js'
import { pageTwoLinkOf } from '@/capture/pageTwoLinkOf.js'
import { PREVIOUS_PAGE_NAME } from '@/capture/PREVIOUS_PAGE_NAME.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Pages the main region's repeated collection, a card grid or a list, forward
 * once and back once when it offers a pager, then returns to the address it
 * started from so the checks that follow read the first page again.
 */
export const checkCollectionPagination = async (
  page: Page,
  main: string,
): Promise<BehaviourFailure[]> => {
  const items = await collectionItems(page, main)
  if (items.length < MIN_COLLECTION_ITEMS) return []
  const next =
    (await pageControlOf(page, main, NEXT_PAGE_NAME, 'next')) ??
    (await pageTwoLinkOf(page, main))
  if (!next) return []
  const start = page.url()
  // A "next" link that leaves the route (the next article) is not a pager,
  // unless a numbered "2" beside it says the region is paged.
  const href = await next.getAttribute('href')
  if (
    href !== null &&
    !isPagerAddress(start, href) &&
    !(await pageTwoLinkOf(page, main))
  )
    return []
  const second = await itemsAfterClick(page, main, next)
  const nextUrl = page.url()
  const previous = await pageControlOf(page, main, PREVIOUS_PAGE_NAME, 'prev')
  const back = previous ? await itemsAfterClick(page, main, previous) : null
  if (page.url() !== start) await gotoSettled(page, start)
  const failure = collectionPaginationFailureOf(
    { items, url: start },
    { items: second, url: nextUrl },
    back,
  )
  return failure ? [failure] : []
}
