/** A control that did not do what it shows it does, found by using it. */
export type BehaviourFailure = {
  rule: 'sort-broken' | 'filter-broken'
  /** The control: a column header or the search box. */
  subject: string
  message: string
}
