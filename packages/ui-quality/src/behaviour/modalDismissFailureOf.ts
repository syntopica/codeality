import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Judges how a dialog closed: `backdrop` and `escape` say whether it stayed
 * open after a click on its backdrop and after Escape, null when that was
 * not tried (no backdrop shows, or the dialog could not be opened again).
 */
export const modalDismissFailureOf = (
  subject: string,
  backdrop: boolean | null,
  escape: boolean | null,
): BehaviourFailure | null => {
  const kept = [
    backdrop === true ? 'a click on the backdrop outside it' : '',
    escape === true ? 'Escape' : '',
  ].filter((way) => way !== '')
  if (kept.length === 0) return null
  return {
    rule: 'modal-dismiss',
    subject,
    message: `the open dialog stays open after ${kept.join(' and after ')}; close it on both, as people expect of a dialog that is not asking for an answer`,
  }
}
