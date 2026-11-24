import type { ActionMessageCase } from '@/behaviour/ActionMessageCase.js'
import type { ActionMessageObservation } from '@/behaviour/ActionMessageObservation.js'
import type { ActionMessageOutcome } from '@/behaviour/ActionMessageOutcome.js'
import type { ActionMessageVerdict } from '@/behaviour/ActionMessageVerdict.js'
import { isAcceptedWrong } from '@/behaviour/isAcceptedWrong.js'
import { isFalseSuccess } from '@/behaviour/isFalseSuccess.js'
import { isGeneric } from '@/behaviour/isGeneric.js'
import { isRaw } from '@/behaviour/isRaw.js'
import { isRedacted } from '@/behaviour/isRedacted.js'
import { isRefusedByClient } from '@/behaviour/isRefusedByClient.js'
import { isUnanswered } from '@/behaviour/isUnanswered.js'
import { messageOf } from '@/behaviour/messageOf.js'

/**
 * Judges the message a submit produced; the first matching verdict wins.
 * `as-is` refused by the client with a message is `coverage`, not a finding.
 */
export const actionMessageVerdictOf = (
  actionCase: ActionMessageCase,
  observation: ActionMessageObservation,
): ActionMessageOutcome => {
  const message = messageOf(observation)
  if (observation.busy && message === '') return 'hang'
  if (isUnanswered(observation, message)) return 'absent'
  if (isRefusedByClient(actionCase, observation)) return 'coverage'
  const rubric: [ActionMessageVerdict, boolean][] = [
    ['redacted', isRedacted(message)],
    ['raw', isRaw(message, observation)],
    ['false-success', isFalseSuccess(actionCase, message)],
    ['generic', isGeneric(message)],
    ['accepted-wrong', isAcceptedWrong(actionCase, observation, message)],
  ]
  return rubric.find(([, matches]) => matches)?.[0] ?? 'pass'
}
