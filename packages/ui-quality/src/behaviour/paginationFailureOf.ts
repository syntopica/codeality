import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Judges one step forward and one back: the next page must show other rows,
 * and the previous one must bring the first page back.
 */
export const paginationFailureOf = (
  first: string[],
  next: string[],
  back: string[] | null,
): BehaviourFailure | null => {
  if (next.join('\n') === first.join('\n'))
    return {
      rule: 'pagination-broken',
      subject: 'next page',
      message: `"next page" is enabled but the table still shows the same ${String(first.length)} rows`,
    }
  if (back && back.join('\n') !== first.join('\n'))
    return {
      rule: 'pagination-broken',
      subject: 'previous page',
      message:
        '"previous page" after "next page" does not bring back the first page',
    }
  return null
}
