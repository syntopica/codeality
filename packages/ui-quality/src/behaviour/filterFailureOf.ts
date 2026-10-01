import { foldText } from '@/behaviour/foldText.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Judges a search for a word taken from a visible row: rows showing it must
 * remain, and rows without it must not all stay. A paginated list fills the
 * page again with matches, so an unchanged count alone proves nothing.
 */
export const filterFailureOf = (
  token: string,
  before: string[],
  after: string[],
): BehaviourFailure | null => {
  const needle = foldText(token)
  const shows = (row: string): boolean => foldText(row).includes(needle)
  if (!after.some(shows))
    return {
      rule: 'filter-broken',
      subject: 'search box',
      message: `searching for "${token}", a word shown in a row, left ${after.length === 0 ? 'no rows' : 'no row that shows it'}`,
    }
  if (after.length >= before.length && !after.every(shows))
    return {
      rule: 'filter-broken',
      subject: 'search box',
      message: `searching for "${token}" kept all ${String(before.length)} rows, including those that do not show it; the search does not filter`,
    }
  return null
}
