import { ciEntrypoints } from './ciEntrypoints.mjs'
import { expandScripts } from './expandScripts.mjs'

// The fallback entrypoints, used only when there is no workflow to read the
// real ones from.
const ENTRIES = ['check:ci', 'check:quality', 'check:security']

// Each gate, the script name that conventionally runs it, and the command
// fragment that proves it ran even when the project spells it inline. Matching
// on both is what lets a repo write `pnpm exec knip` or `depcruise src`
// directly instead of going through the named script.
const GATES = [
  {
    id: 'type-check',
    script: 'type-check',
    tool: /\btsc\b|\bvue-tsc\b|\btype-check\b/,
  },
  // Only ESLint satisfies this. oxlint is a pre-filter with no type
  // information, so it cannot see most of what the baseline enforces;
  // accepting it here would let a repository drop the real gate and still
  // report as wired.
  { id: 'lint', script: 'lint', tool: /\beslint\b/ },
  { id: 'format', script: 'format:check', tool: /prettier\s+--check/ },
  { id: 'test', script: 'test', tool: /\bvitest\b|\bjest\b|\bnode --test\b/ },
  { id: 'dupes', script: 'dupes', tool: /baseline-dupes|\bjscpd\b/ },
  { id: 'knip', script: 'knip', tool: /\bknip\b/ },
  {
    id: 'deps:graph',
    script: 'deps:graph',
    tool: /baseline-deps-graph|\bdepcruise\b|dependency-cruiser/,
  },
  {
    id: 'type-coverage',
    script: 'type-coverage',
    tool: /baseline-type-coverage|\btype-coverage\b/,
  },
  { id: 'secrets', script: 'secrets:check', tool: /\bgitleaks\b/ },
  { id: 'audit', script: 'audit:check', tool: /\baudit\b/ },
]

/**
 * Every gate must be reachable from what CI runs.
 *
 * Measured from the pipeline, not from a name. Asserting that a workflow says
 * `check:ci` was the wrong question: consumer-g runs every gate in CI as its
 * own step and never uses that word, and it is the best-wired repository in
 * the estate. So the entrypoints are whatever scripts the workflows invoke,
 * and the assertion is that the union of everything reachable from them
 * covers all ten gates - not which entrypoint holds which gate.
 *
 * With no workflow at all the check falls back to the three `check:*` scripts,
 * so the report still says which gates are missing locally. `checkCiWorkflow`
 * reports the absent pipeline separately; both findings are true, and fixing
 * the pipeline without fixing the gates would leave half the report standing.
 *
 * This is the estate's most common failure by a wide margin: eleven of
 * seventeen adopters had `check:quality` written into package.json by this
 * tool and nothing calling it, which made knip, dependency-cruiser and
 * type-coverage - the findings a reviewer cannot see in a diff - dead
 * configuration.
 */
export function checkGateCoverage({ scripts, workflows = [], runners = {} }) {
  const fromCi = ciEntrypoints(workflows, scripts)
  const entries = fromCi.length ? fromCi : ENTRIES
  const source = fromCi.length ? 'CI' : 'any check:* entrypoint'

  if (!entries.some((name) => Object.hasOwn(scripts, name))) {
    return [
      {
        id: 'check-entrypoints',
        level: 'error',
        message: 'no `check:ci`, `check:quality` or `check:security` script',
        detail: 'Run `create-baseline --write` to add them.',
      },
    ]
  }

  const { names, text } = expandScripts(scripts, entries, runners)
  const findings = []

  for (const gate of GATES) {
    if (names.has(gate.script) || gate.tool.test(text)) continue
    findings.push({
      id: `gate:${gate.id}`,
      level: 'error',
      message: `\`${gate.id}\` is never invoked`,
      detail: scripts[gate.script]
        ? `The \`${gate.script}\` script exists but ${source} never reaches it.`
        : `No \`${gate.script}\` script, and ${source} does not run the tool directly.`,
      fix: scripts[gate.script]
        ? {
            kind: 'append-to-script',
            name: entryFor(gate.id),
            value: `pnpm ${gate.script}`,
          }
        : undefined,
    })
  }

  return findings
}

// Where a missing gate is appended when `--fix` runs: the fast path for the
// gates a developer expects before pushing, the slower whole-tree pass for the
// ones that walk the graph, the full-clone job for the ones that need it.
function entryFor(id) {
  if (id === 'secrets' || id === 'audit') return 'check:security'
  if (id === 'deps:graph' || id === 'type-coverage') return 'check:quality'
  return 'check:ci'
}
