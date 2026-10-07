import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Judges a table or a repeated list that offers no pager: rendering more
 * than `maxRows` rows or items at once means the whole set reaches the
 * browser and the page grows with the data.
 */
export const unpagedFailureOf = (
  rows: number,
  hasPager: boolean,
  maxRows: number,
  region: 'table' | 'list' = 'table',
): BehaviourFailure | null =>
  !hasPager && rows > maxRows
    ? {
        rule: 'pagination-missing',
        subject: `main ${region}`,
        message: `the ${region} renders ${String(rows)} ${region === 'table' ? 'rows' : 'items'} at once with no pager and no virtual scrolling; over ${String(maxRows)} it should page or virtualise`,
      }
    : null
