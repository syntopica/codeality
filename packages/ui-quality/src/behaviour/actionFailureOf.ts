import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Judges a form submitted while every write fails. Whatever happened, the
 * user must see something: a validation message, an error, a new page.
 */
export const actionFailureOf = (
  subject: string,
  informed: boolean,
  attempted: boolean,
): BehaviourFailure | null => {
  if (informed) return null
  return {
    rule: 'action-silent',
    subject,
    message: attempted
      ? 'the submission failed (HTTP 500) and the screen did not change: the user is not told it failed'
      : 'submitting changes nothing on screen: no request, no validation message',
  }
}
