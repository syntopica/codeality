/** A finding the project has decided to keep, with the reason it gives. */
export type DisableEntry = {
  rule: string
  route: string | null
  selector: string | null
  /** Text the finding's message must contain, to keep one console error or request rather than the rule. */
  message: string | null
  reason: string
}
