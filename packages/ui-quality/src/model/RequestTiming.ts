/** One data request a page made while it loaded, and how long it took. */
export type RequestTiming = {
  method: string
  /** Path and query, without the origin. */
  path: string
  /** The Next.js server action id the request invoked, when it was one. */
  action: string | null
  durationMs: number
}
