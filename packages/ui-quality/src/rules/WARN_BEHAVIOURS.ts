import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/** Behaviour findings about layout rather than a broken control: reported as warnings. */
export const WARN_BEHAVIOURS = new Set<BehaviourFailure['rule']>([
  'interaction-shift',
])
