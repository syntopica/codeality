/** Writes that are being made to fail, and whether the page attempted any. */
export type InjectedFailure = {
  attempted: () => boolean
  stop: () => Promise<void>
}
