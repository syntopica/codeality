import type { KnipConfig } from 'knip'

import { FRAMEWORK_ENTRIES, type KnipFramework } from './knip-framework'

// Every template installs these as peer dependencies of
// @busirocket/eslint-config: the config factories (base.ts and friends)
// `import` them by bare specifier, and pnpm's isolated node_modules needs
// each consumer to declare them directly for that import to resolve. No
// template file ever imports these packages itself (they only import from
// '@busirocket/eslint-config/*'), so knip can't see the real caller and
// reports them as unused. Mirrors the same list and rationale in the
// repo-root knip.config.ts for the `templates/*` workspace.
//
// Two packages that used to sit here - `@vitest/eslint-plugin` and
// `eslint-plugin-testing-library` - were removed on 2026-08-24: knip resolved
// the real caller in all eight templates, so the entries were redundant
// everywhere and produced a hint no consumer could silence. The rest stay:
// `eslint-config-prettier` is redundant in four of the eight and load-bearing
// in the other four, which is exactly the case the list exists for. A consumer
// whose layout hides a caller can add its own entries through
// `ignoreDependencies`, which merges with this list rather than replacing it.
//
// Where an entry here IS redundant, knip says so:
// `<package>  knip.config.ts  Remove from ignoreDependencies`. That is a hint,
// not a gate failure. Do not filter the list consumer-side to silence it: the
// filter would drift the moment this list changes, and the cost of being wrong
// is a dependency that silently stops being checked.
// The tools this package's own runners spawn through `pnpm exec`:
// `baseline-dupes` spawns `jscpd`, `baseline-type-coverage` spawns
// `type-coverage`, `baseline-deps-graph` spawns `depcruise`. A project that
// wires the runner into its scripts never names the underlying tool anywhere
// knip can see, so knip reports a real dependency as unused. Found in
// busirocket the moment its `type-coverage` script became
// `baseline-type-coverage`.
//
// `dependency-cruiser` is on the list even though a project calling
// `depcruise` directly resolves it fine: there knip emits a `Remove from
// ignoreDependencies` hint, which is a hint and not a gate failure, and the
// cost of leaving it off is a real dependency silently reported as dead.
const BASELINE_RUNNER_DEPENDENCIES = [
  'jscpd',
  'type-coverage',
  'dependency-cruiser',
]

const ESLINT_PEER_DEPENDENCIES = [
  '@eslint/js',
  'eslint-config-prettier',
  'eslint-plugin-promise',
  'eslint-plugin-security',
  'eslint-plugin-unused-imports',
  'typescript-eslint',
]

/**
 * Knip configuration for a baseline template.
 *
 * Rules that block: unused files, unused exports and exported types, declared
 * dependencies nobody imports, and imports of undeclared dependencies. Those
 * are the four findings a reviewer cannot see in a diff.
 *
 * `binaries` and `unresolved` stay non-blocking: pnpm script indirection and
 * Turbo produce false positives on both.
 */
export const createKnipConfig = (options: {
  framework: KnipFramework
  /**
   * Binaries knip cannot resolve. Nothing is ignored by default: an entry for
   * a binary knip *can* resolve becomes a permanent `Remove from
   * ignoreBinaries` hint the consumer has no way to silence.
   */
  ignoreBinaries?: string[]
  /** Merged with the built-in lists, never replacing them. */
  ignoreDependencies?: string[]
  /**
   * Files knip must not analyse at all. The standing case is a drizzle schema
   * aggregator: `drizzle.config.ts` names one file as THE schema, so every
   * table it exports is live even though no TypeScript file imports it, and
   * acting on the resulting "unused export" report makes the next generated
   * migration emit `DROP TABLE`.
   */
  ignore?: string[]
  /**
   * Extra source globs, merged with the framework preset's `project`.
   *
   * Every preset assumes the framework's own layout - for Next.js, `src/` and
   * `app/`. An app whose code sits at the repo root (`components/`, `hooks/`,
   * `services/`, ...) is invisible to knip under that preset, and every
   * dependency reached only from there reports as unused. This is a merge, not
   * a replacement: the preset's globs stay, so a project cannot silently opt
   * out of scanning the directories the framework does own.
   */
  project?: string[]
  /**
   * Extra entry globs, merged with the framework preset's `entry`. Same
   * reasoning as `project`, for a root nobody's plugin registers - a worker,
   * a CLI, a script the app spawns.
   */
  entry?: string[]
  /**
   * Set `false` for a package that is finished but not wired up yet. With the
   * default `true` its entire public API reports as unused exports, and the
   * obvious reading of that report is "delete this package".
   */
  includeEntryExports?: boolean
  /**
   * Set `false` to stop knip loading `drizzle.config.ts`. That file throws by
   * design when `DATABASE_URL` is unset, so the gate otherwise needs a live
   * database in CI. Adding the file to `ignore` does not stop the plugin -
   * only this does.
   */
  drizzle?: false
}): KnipConfig => {
  const { entry, project } = FRAMEWORK_ENTRIES[options.framework]

  return {
    entry: [...entry, ...(options.entry ?? [])],
    project: [...project, ...(options.project ?? [])],
    ...(options.ignore ? { ignore: options.ignore } : {}),
    ...(options.drizzle === false ? { drizzle: false } : {}),
    // Without this, exports of entry files are never checked, so a dead export
    // added to main.ts / index.ts would pass the gate. Coverage is real but
    // partial: verified with a probe export that it now fails `nestjs-app`
    // (src/main.ts) and `ts-package` (src/index.ts), and that it still does not
    // fail `nextjs-app` (app/page.tsx), `vite-react-app` (src/main.tsx) or
    // `vue-app` (src/main.ts) - files a knip framework plugin registers as an
    // entry of its own, which the option does not reach.
    includeEntryExports: options.includeEntryExports ?? true,
    // The Primary Unit Rule (code-policy/no-hidden-top-level-declarations)
    // forbids a hidden top-level declaration, so a helper an entry file uses
    // only itself still has to be exported - NestJS's `bootstrap`, called by
    // `void bootstrap()` one line below its own definition, is the standing
    // example. The per-type form (`{ function, variable, ... }`) does not
    // exempt it - knip classifies `export const bootstrap = async () => {}`
    // under none of the seven keys the schema accepts - so this is the global
    // boolean. It only hides an export that its own file already uses: an
    // export nothing references at all still fails the gate.
    ignoreExportsUsedInFile: true,
    ignoreBinaries: options.ignoreBinaries ?? [],
    ignoreDependencies: [
      ...BASELINE_RUNNER_DEPENDENCIES,
      ...ESLINT_PEER_DEPENDENCIES,
      ...(options.ignoreDependencies ?? []),
    ],
    rules: {
      files: 'error',
      dependencies: 'error',
      devDependencies: 'error',
      unlisted: 'error',
      exports: 'error',
      types: 'error',
      duplicates: 'error',
      binaries: 'warn',
      unresolved: 'warn',
    },
  }
}
