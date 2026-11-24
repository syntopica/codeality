import type { ActionMessageCase } from '@/behaviour/ActionMessageCase.js'
import type { ActionMessageObservation } from '@/behaviour/ActionMessageObservation.js'

/** An `as-is` submit the app refused itself: the configured inputs are incomplete. */
export const isRefusedByClient = (
  actionCase: ActionMessageCase,
  observation: ActionMessageObservation,
): boolean => actionCase === 'as-is' && observation.client
