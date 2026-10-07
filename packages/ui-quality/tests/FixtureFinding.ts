/** The fields of a `check --json` finding the integration tests read. */
export type FixtureFinding = {
  rule: string
  route: string
  subject: string
  message: string
  screens: string[]
}
