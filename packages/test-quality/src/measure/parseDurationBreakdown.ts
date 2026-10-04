import { phaseShares } from '@/measure/phaseShares.js'
import type { DurationBreakdown } from '@/model/DurationBreakdown.js'

/**
 * Reads vitest's `Duration 72.52s (environment 31%, setup 28%, ...)` line.
 * The phases are summed across workers, so they say where the work went,
 * not what the wall clock waited on. Null when the line is absent.
 */
export const parseDurationBreakdown = (
  stdout: string,
): DurationBreakdown | null => {
  const line = /Duration\s+([\d.]+)(m?s)\s+\(([^)]*)\)/.exec(stdout)
  if (!line) return null
  const value = Number(line[1])
  return {
    seconds: line[2] === 'ms' ? value / 1000 : value,
    phases: phaseShares(line[3] ?? ''),
  }
}
