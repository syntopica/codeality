import type { ActionMessageCase } from '@/behaviour/ActionMessageCase.js'
import type { ActionMessageObservation } from '@/behaviour/ActionMessageObservation.js'
import { isSuccessOnly } from '@/behaviour/isSuccessOnly.js'

/** Under `missing` or `wrong`, the server took the bad value: a detail page or a success-only message. */
export const isAcceptedWrong = (
  actionCase: ActionMessageCase,
  observation: ActionMessageObservation,
  message: string,
): boolean =>
  (actionCase === 'missing' || actionCase === 'wrong') &&
  !observation.client &&
  !observation.invalidField &&
  (observation.addressChanged || isSuccessOnly(message))
