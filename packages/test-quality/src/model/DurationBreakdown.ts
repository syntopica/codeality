/** vitest's summary line: total seconds and the share of each phase, in %. */
export type DurationBreakdown = {
  seconds: number
  phases: Record<string, number>
}
