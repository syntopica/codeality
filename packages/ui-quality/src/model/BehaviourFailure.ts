/** A control that did not do what it shows it does, or moved the page when used, found by using it. */
export type BehaviourFailure = {
  rule:
    | 'sort-broken'
    | 'filter-broken'
    | 'empty-state-missing'
    | 'pagination-broken'
    | 'pagination-missing'
    | 'action-silent'
    | 'interaction-shift'
  /** The control: a column header, the search box, a pager, a form or a toggle group. */
  subject: string
  message: string
}
