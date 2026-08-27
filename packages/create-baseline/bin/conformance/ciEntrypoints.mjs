// A package script invoked from a workflow step. `run:` blocks are shell, so
// this is the same set of forms scripts use to call each other, matched
// against the whole workflow text rather than parsed YAML - a dependency on a
// YAML parser would buy nothing here, since a step's `run:` is a shell string
// either way.
const INVOCATION = /\b(?:pnpm|npm|yarn|bun)\s+(?:run\s+)?([a-z][\w:-]*)/g
const TURBO_INVOCATION =
  /\b(?:turbo|nx)\s+run\s+((?:[a-z][\w:-]*\s+)*[a-z][\w:-]*)/g

/**
 * The package scripts CI actually runs.
 *
 * Asserting that a workflow names `check:ci` would have been the wrong
 * question. consumer-g runs every gate in CI as its own step - `pnpm run
 * type-check`, `pnpm run lint`, `pnpm run dupes` - and never says `check:ci`
 * anywhere; it is the best-wired repository in the estate and a name-matching
 * check called it unwired. What matters is which gates the pipeline reaches,
 * so that is what gets measured.
 *
 * Only scripts the project defines are returned: `pnpm install` and
 * `pnpm audit` are not entrypoints, and a workflow is full of shell that is
 * not a package script.
 */
export function ciEntrypoints(workflows, scripts) {
  const entries = new Set()

  for (const workflow of workflows) {
    for (const match of workflow.text.matchAll(INVOCATION)) {
      if (Object.hasOwn(scripts, match[1])) entries.add(match[1])
    }
    for (const match of workflow.text.matchAll(TURBO_INVOCATION)) {
      for (const target of match[1].trim().split(/\s+/)) entries.add(target)
    }
  }

  return [...entries]
}
