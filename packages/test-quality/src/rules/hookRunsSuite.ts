import type { Finding } from '@/model/Finding.js'

/**
 * A hook that reaches both the static gate and the whole test suite. Not a
 * defect on its own: it is the moment to ask whether the push repeats what
 * was just run by hand, and whether hosted CI already covers it.
 */
export const hookRunsSuite = (
  reached: string[],
  scripts: Record<string, string>,
  hook: string,
): Finding[] => {
  const suite = reached.filter((name) =>
    /\bvitest\b(?!\s+--?watch)/.test(scripts[name] ?? ''),
  )
  const lint = reached.filter((name) => /\beslint\b/.test(scripts[name] ?? ''))
  if (suite.length === 0 || lint.length === 0) return []
  return [
    {
      rule: 'hook-runs-full-gate',
      severity: 'info',
      message: `the ${hook} hook runs the static gate and the whole suite on every push`,
      evidence: [...lint, ...suite].map(
        (name) => `${name}: ${scripts[name] ?? ''}`,
      ),
    },
  ]
}
