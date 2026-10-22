/** The part of a table cell, as the page sees it, that ordering reads. */
export type SortCell = {
  innerText: string
  querySelector: (selector: string) => {
    innerText: string
    getAttribute: (name: string) => string | null
  } | null
}
