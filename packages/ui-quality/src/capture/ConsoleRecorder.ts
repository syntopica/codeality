/** Console errors gathered from one page until `stop` is called. */
export type ConsoleRecorder = {
  errors: string[]
  stop: () => void
}
