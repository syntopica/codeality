/** A finding the project has decided to keep, with the reason it gives. */
export type DisableEntry = {
  rule: string
  route: string | null
  selector: string | null
  reason: string
}
