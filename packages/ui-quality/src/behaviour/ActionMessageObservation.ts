/** What one submit showed, collected once the control's deadline ended or it went idle. */
export type ActionMessageObservation = {
  /** Text of new alerts and their described-by targets. */
  alerts: string[]
  /** Text of `window.alert` and `confirm` dialogs. */
  dialogs: string[]
  /** New visible lines, as `newLinesOf` returns them. */
  lines: string[]
  /** The submit control's current text. */
  controlText: string
  /** The visible lines before the submit. */
  before: string[]
  addressChanged: boolean
  /** Still disabled, `aria-busy`, or showing a progressive verb at the deadline. */
  busy: boolean
  /** No write left the browser. */
  client: boolean
  /** A field was marked invalid. */
  invalidField: boolean
  /** The marker body a `fail-action` case sent, when it did. */
  injectedBody?: string
}
