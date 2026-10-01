import type { ColumnOrder } from '@/behaviour/ColumnOrder.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Judges two clicks on a sortable header. The column must come out ordered
 * after at least one, and two ordered results must run opposite ways; a
 * third "unsorted" state after the second click is a legitimate design.
 */
export const sortFailureOf = (
  label: string,
  first: ColumnOrder,
  second: ColumnOrder,
): BehaviourFailure | null => {
  const subject = `column "${label}"`
  if (first === 'none' && second === 'none')
    return {
      rule: 'sort-broken',
      subject,
      message: `clicking the "${label}" header twice left its visible values out of order both times; it sorts by something the column does not show, or not at all`,
    }
  if (first === second && first !== 'none' && first !== 'flat')
    return {
      rule: 'sort-broken',
      subject,
      message: `a second click on the "${label}" header kept the column ${first === 'asc' ? 'ascending' : 'descending'}; it should reverse the order`,
    }
  return null
}
