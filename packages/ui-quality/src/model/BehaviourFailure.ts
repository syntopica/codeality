/** A control that did not do what it shows it does, found by using it. */
export type BehaviourFailure = {
  rule:
    | 'sort-broken'
    | 'filter-broken'
    | 'empty-state-missing'
    | 'pagination-broken'
    | 'pagination-missing'
    | 'action-silent'
  /** The control: a column header, the search box, a pager or a form. */
  subject: string
  message: string
}
