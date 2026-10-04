import type { Finding } from '@/model/Finding.js'
import { UNCACHED_TOOLS } from '@/model/UNCACHED_TOOLS.js'

/**
 * Lint and format steps a git hook reaches without a cache. A hook repeats
 * work the author usually just did, so a warm cache turns minutes into
 * seconds (ESLint 175 s cold, 6 s warm on verticagtm, 2026-10-04). Hosted CI
 * is not flagged: running cold there catches typed rules a cache left stale.
 */
export const uncachedHookLint = (
  reached: string[],
  scripts: Record<string, string>,
  hook: string,
): Finding[] => {
  const evidence = reached.flatMap((name) =>
    UNCACHED_TOOLS.filter(({ pattern }) =>
      pattern.test(scripts[name] ?? ''),
    ).map(({ tool }) => `${name}: ${tool} without --cache`),
  )
  if (evidence.length === 0) return []
  return [
    {
      rule: 'uncached-hook-lint',
      severity: 'warning',
      message: `the ${hook} hook runs lint or format steps with no cache`,
      evidence,
    },
  ]
}
