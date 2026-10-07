/** Characters of text in the main region, and those painted invisible at rest. */
export type HiddenText = {
  total: number
  /** Laid out but at opacity 0 or `visibility: hidden`. */
  hidden: number
  /** The first element holding hidden text; empty when there is none. */
  selector: string
}
