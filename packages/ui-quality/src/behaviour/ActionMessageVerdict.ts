/** Why a failure message is bad, in the order the rubric tries them. */
export type ActionMessageVerdict =
  | 'hang'
  | 'absent'
  | 'redacted'
  | 'raw'
  | 'false-success'
  | 'generic'
  | 'accepted-wrong'
