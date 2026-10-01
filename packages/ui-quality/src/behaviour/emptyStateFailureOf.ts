import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Judges a search nothing matches. An empty table with nothing new on screen
 * leaves the user unable to tell "no results" from "still loading" or
 * "broken". A single remaining row is read as the table's own message row.
 */
export const emptyStateFailureOf = (
  rows: string[],
  newLines: string[],
): BehaviourFailure | null =>
  rows.length === 0 && newLines.length === 0
    ? {
        rule: 'empty-state-missing',
        subject: 'search box',
        message:
          'a search with no match empties the table and shows nothing in its place: no "no results" message',
      }
    : null
