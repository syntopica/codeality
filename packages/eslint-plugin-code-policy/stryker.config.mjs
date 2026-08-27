// Mutation testing for the rule engine, on demand rather than in CI.
//
// Coverage says a line executed. It does not say an assertion would have
// noticed if that line were wrong, and that distinction matters more here than
// anywhere else in the estate: a rule that silently stops reporting stops
// protecting every repository that installs this plugin, and every one of them
// still shows a green build.
//
// Scoped to `src/rules`. The configs and the barrel are declarative wiring
// with no branches worth mutating, and including them would spend minutes
// killing mutants that only prove a re-export re-exports.
//
// Not a CI gate: a full run takes minutes, and a surviving mutant is a
// question for a human ("is this branch worth a test?") rather than a build
// failure. Run it when changing a rule's logic:  pnpm run mutation
export default {
  packageManager: 'pnpm',
  // Named explicitly. Stryker discovers plugins by scanning node_modules, and
  // under pnpm's isolated layout the runner is a link this package owns rather
  // than a hoisted sibling of the core - so the scan finds nothing and the
  // run dies with "no TestRunner plugins were loaded".
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  reporters: ['progress', 'clear-text'],
  coverageAnalysis: 'perTest',
  mutate: ['src/rules/**/*.ts'],
  // Entered at the measured floor, not at an aspiration. The first run scored
  // 60.80% against a suite with ~100% line coverage: 374 mutants survived, so
  // the tests execute the rules thoroughly and assert on them loosely - a
  // changed message id or a moved report location usually goes unnoticed.
  //
  // `break` tracks the latest measured package floor, rounded down, so the
  // gate can only ratchet upward without making the current suite red.
  thresholds: { high: 85, low: 70, break: 67 },
  timeoutMS: 60000,
  // The sandbox is a copy of `src` with instrumentation woven through it, and
  // a left-behind copy is linted by every gate that globs the repository -
  // which reports the instrumentation rather than the code.
  cleanTempDir: true,
}
