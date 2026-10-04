import type { Finding } from '@/model/Finding.js'

/**
 * Candidates that passed when run under node: they pay for a DOM they never
 * use. Move them to a node project (or drop the global DOM environment) and
 * give the few that need a window a `// @vitest-environment jsdom` docblock.
 */
export const nodeMovable = (
  passing: string[],
  candidateCount: number,
): Finding[] => {
  if (passing.length === 0) return []
  return [
    {
      rule: 'dom-environment-unused',
      severity: 'warning',
      message: `${String(passing.length)} of ${String(candidateCount)} candidate files pass under node and still run under a DOM environment`,
      evidence: passing,
    },
  ]
}
