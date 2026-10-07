/** One element the Tab pass reached, and whether focusing it changed anything visible. */
export type FocusStop = {
  /** The element's id in the snapshot. */
  element: number
  changed: boolean
}
