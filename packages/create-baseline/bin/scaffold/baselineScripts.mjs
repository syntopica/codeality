// The package.json scripts a fully wired baseline project runs. Only the ones
// a project does not already define are added: an existing `lint` that scopes
// itself to `src` is the project's decision, not drift.
//
// `dupes` and `type-coverage` go through the runners in
// @busirocket/quality-config rather than naming jscpd and type-coverage
// directly, so the shared config is read in place instead of copied.
//
// The three `check:*` entrypoints are what CI invokes, one job each. They are
// split by cost, not by category: `check:ci` is the fast path a developer runs
// before pushing, `check:quality` holds the whole-tree gates that need a
// second pass over the graph, `check:security` needs a full clone and a
// gitleaks binary. Between them they must invoke every gate - the conformance
// check asserts exactly that union, not this particular split, so a project
// that moves `knip` from one to another stays conformant.
export function baselineScripts() {
  return {
    // Without this the generated lefthook.yml is inert: the hooks are only
    // written into .git/hooks when `lefthook install` runs. Three repos in a
    // row adopted the gates with the file in place and no hook installed.
    prepare: 'lefthook install',
    // A two-second pass over the same files before the typed one, which takes
    // minutes on a large repository. Catches the breaks that do not need type
    // information; ESLint remains the authority.
    'lint:fast': 'oxlint --deny-warnings .',
    'lint:suppress': 'eslint . --suppress-all',
    'lint:prune': 'eslint . --prune-suppressions',
    dupes: 'baseline-dupes .',
    knip: 'knip',
    'deps:graph': 'depcruise src',
    'type-coverage': 'baseline-type-coverage',
    'secrets:check': 'gitleaks detect --no-banner --redact',
    // Gated at `moderate`, not `high`, because a known exception is now
    // expressible: `baseline-audit` reads `.baseline-advisories.json`, where
    // every waiver carries a reason and an expiry date and comes back on its
    // own when that date passes. Without somewhere to put a judged finding,
    // the only way to silence one is to raise the level for everything.
    'audit:check': 'baseline-audit --level moderate',
    'check:ci':
      'pnpm lint:fast && pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm dupes && pnpm knip',
    'check:quality': 'pnpm deps:graph && pnpm type-coverage',
    'check:security': 'pnpm secrets:check && pnpm audit:check',
  }
}
