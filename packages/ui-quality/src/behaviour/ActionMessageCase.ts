/** The failure a submit is judged under, named as the unhappy-path audit design names it. */
export type ActionMessageCase =
  | 'fail-500'
  | 'fail-status'
  | 'fail-hang'
  | 'fail-action'
  | 'stale-action'
  | 'as-is'
  | 'missing'
  | 'wrong'
