import type { ActionMessageObservation } from '@/behaviour/ActionMessageObservation.js'

/** No message, no dialog, no change of address. */
export const isUnanswered = (
  observation: ActionMessageObservation,
  message: string,
): boolean =>
  message === '' &&
  observation.dialogs.length === 0 &&
  !observation.addressChanged
