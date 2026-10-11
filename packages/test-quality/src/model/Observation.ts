/**
 * A measurement or a reading of the project's config that asks for no change:
 * timings, memory, what a hook runs. Printed beside the findings, never one,
 * so it never fails the command.
 */
export type Observation = {
  name: string
  message: string
  evidence: string[]
}
