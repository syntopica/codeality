/** Where a diagnostic applies: a file position, a route, or both. */
export type DiagnosticLocation = {
  path?: string
  line?: number
  route?: string
}
