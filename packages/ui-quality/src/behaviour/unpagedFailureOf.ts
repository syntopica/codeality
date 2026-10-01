import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Judges a table that offers no pager: rendering more than `maxRows` body
 * rows at once means the whole set reaches the browser and the page grows
 * with the data.
 */
export const unpagedFailureOf = (
  rows: number,
  hasPager: boolean,
  maxRows: number,
): BehaviourFailure | null =>
  !hasPager && rows > maxRows
    ? {
        rule: 'pagination-missing',
        subject: 'main table',
        message: `the table renders ${String(rows)} rows at once with no pager and no virtual scrolling; over ${String(maxRows)} it should page or virtualise`,
      }
    : null
