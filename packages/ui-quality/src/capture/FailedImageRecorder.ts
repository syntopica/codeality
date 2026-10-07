/** Image requests that failed, gathered from one page until `stop` is called. */
export type FailedImageRecorder = {
  urls: string[]
  stop: () => void
}
