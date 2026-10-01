import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/** Clearing a search must bring back the rows it hid. */
export const restoreFailureOf = (
  before: string[],
  restored: string[],
): BehaviourFailure | null =>
  restored.length < before.length
    ? {
        rule: 'filter-broken',
        subject: 'search box',
        message: `clearing the search brought back ${String(restored.length)} of ${String(before.length)} rows`,
      }
    : null
