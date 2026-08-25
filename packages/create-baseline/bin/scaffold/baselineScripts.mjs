// The package.json scripts a fully wired baseline project runs. Only the ones
// a project does not already define are added: an existing `lint` that scopes
// itself to `src` is the project's decision, not drift.
//
// `dupes` and `type-coverage` go through the runners in
// @busirocket/quality-config rather than naming jscpd and type-coverage
// directly, so the shared config is read in place instead of copied.
export function baselineScripts() {
  return {
    // Without this the generated lefthook.yml is inert: the hooks are only
    // written into .git/hooks when `lefthook install` runs. Three repos in a
    // row adopted the gates with the file in place and no hook installed.
    prepare: 'lefthook install',
    'lint:suppress': 'eslint . --suppress-all',
    'lint:prune': 'eslint . --prune-suppressions',
    dupes: 'baseline-dupes .',
    knip: 'knip',
    'deps:graph': 'depcruise src',
    'type-coverage': 'baseline-type-coverage',
    'secrets:check': 'gitleaks detect --no-banner --redact',
    'audit:check': 'pnpm audit --audit-level=high',
    'check:quality': 'pnpm knip && pnpm deps:graph && pnpm type-coverage',
    'check:security': 'pnpm secrets:check && pnpm audit:check',
  }
}
