/** The part of an axe violation the report keeps. */
export type AxeViolation = {
  id: string
  impact: string | null
  help: string
  nodes: { target: string; summary: string }[]
}
