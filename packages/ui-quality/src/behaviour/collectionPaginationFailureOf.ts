import type { CollectionPage } from '@/behaviour/CollectionPage.js'
import { MAX_REPEATED_SHARE } from '@/behaviour/MAX_REPEATED_SHARE.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Judges one step forward and one back through a repeated collection, cards
 * or a list, by the identity of its items: the next page must show items the
 * first did not, mostly, and the previous one must bring the first set back.
 * A next page with no items is left to other rules.
 */
export const collectionPaginationFailureOf = (
  first: CollectionPage,
  next: CollectionPage,
  back: string[] | null,
): BehaviourFailure | null => {
  const seen = new Set(first.items)
  const repeated = next.items.filter((item) => seen.has(item)).length
  const count = String(next.items.length)
  if (next.items.length > 0 && repeated === next.items.length)
    return {
      rule: 'pagination-broken',
      subject: 'next page',
      message:
        next.url === first.url
          ? `"next page" leaves both the address and the ${count} items unchanged`
          : `"next page" opens ${next.url} but it shows the same ${count} items as the first page`,
    }
  if (
    next.items.length > 0 &&
    repeated / next.items.length > MAX_REPEATED_SHARE
  )
    return {
      rule: 'pagination-broken',
      subject: 'next page',
      message: `"next page" repeats ${String(repeated)} of its ${count} items from the first page, so others are never shown`,
    }
  const returned = new Set(back)
  if (
    back &&
    (returned.size !== seen.size ||
      [...seen].some((item) => !returned.has(item)))
  )
    return {
      rule: 'pagination-broken',
      subject: 'previous page',
      message:
        '"previous page" after "next page" does not bring back the first page',
    }
  return null
}
