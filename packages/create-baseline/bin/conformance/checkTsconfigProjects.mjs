import { expandScripts } from './expandScripts.mjs'

// `tsc -b` (or `vue-tsc -b`) with no project argument builds the root
// solution, which reaches every reference; only flags may follow before the
// command ends. `tsc -b tsconfig.app.json` names projects instead, and those
// are matched per reference below.
const BARE_BUILD =
  /\b(?:vue-tsc|tsc)\s+(?:-b|--build)(?:\s+-[\w-]+)*\s*(?:&&|\|\||;|$)/

/**
 * Every project a solution root references must be reachable from
 * `type-check`.
 *
 * The defect this catches is the expensive kind: a gate that exits 0 while
 * reading almost nothing. consumer-g's root tsconfig.json referenced three
 * projects and its `type-check` script named two of them, so `app/`,
 * `proxy.ts` and `instrumentation.ts` - the largest surface in the repo -
 * reached `check:ci` unchecked for months while the estate report called the
 * repository conformant. The check is purely structural, no TypeScript
 * needed: read the root's `references`, read the `type-check` script, diff.
 *
 * With no `type-check` script at all there is nothing to diff against;
 * `checkGateCoverage` already reports the missing gate, and repeating it here
 * would be the same finding twice.
 */
export function checkTsconfigProjects({ tsconfigs, scripts, runners = {} }) {
  if (!tsconfigs?.solution) return []

  const { text } = expandScripts(scripts, ['type-check'], runners)
  if (!text) return []
  if (BARE_BUILD.test(text)) return []

  const findings = []
  for (const { reference } of tsconfigs.leaves) {
    if (text.includes(reference)) continue
    findings.push({
      id: `tsconfig-project:${reference}`,
      level: 'error',
      message: `\`${reference}\` is referenced by the solution root but never type-checked`,
      detail:
        'The root tsconfig.json references this project and `type-check` ' +
        'never names it, so its files pass CI unread. Run `tsc -b` at the ' +
        'root, or add `tsc -p <project> --noEmit` for each reference.',
    })
  }
  return findings
}
