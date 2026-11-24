import type { ActionMessageObservation } from '@/behaviour/ActionMessageObservation.js'
import { RAW_TEXT } from '@/behaviour/RAW_TEXT.js'
import { unseenMachineIdIn } from '@/behaviour/unseenMachineIdIn.js'

export const isRaw = (
  message: string,
  observation: ActionMessageObservation,
): boolean =>
  RAW_TEXT.test(message) ||
  unseenMachineIdIn(message, observation.before) ||
  (observation.injectedBody !== undefined &&
    message.includes(observation.injectedBody))
