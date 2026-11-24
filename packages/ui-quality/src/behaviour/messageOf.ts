import type { ActionMessageObservation } from '@/behaviour/ActionMessageObservation.js'
import { PROGRESSIVE_LINE } from '@/behaviour/PROGRESSIVE_LINE.js'

/** The feedback under judgment: alerts, dialogs, then new lines, busy labels dropped. */
export const messageOf = (observation: ActionMessageObservation): string =>
  [...observation.alerts, ...observation.dialogs, ...observation.lines]
    .map((line) => line.trim())
    .filter(
      (line) =>
        line !== '' &&
        line !== observation.controlText.trim() &&
        !PROGRESSIVE_LINE.test(line),
    )
    .join(' ')
