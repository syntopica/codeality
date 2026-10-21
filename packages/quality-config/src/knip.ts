// `KnipConfiguration`, not `KnipConfig`: the latter is a union that also
// admits a function, so a consumer spreading this factory's result to override
// one rule gets "Property 'rules' does not exist on type
// 'RawConfigurationOrFn'". Returning the object shape lets a project extend the
// config without casting it first.
import type { KnipConfiguration } from 'knip'

import { FRAMEWORK_RUNTIME_PACKAGES } from './FRAMEWORK_RUNTIME_PACKAGES'
import { FRAMEWORK_ENTRIES, type KnipFramework } from './knip-framework'
import { matchedPresetPatterns } from './matchedPresetPatterns'
import { peersOfListedDependencies } from './peersOfListedDependencies'
import { PRODUCTION_PROJECT_EXCLUSIONS } from './PRODUCTION_PROJECT_EXCLUSIONS'
import { readListedDependencies } from './readListedDependencies'
import { runnerDependenciesToIgnore } from './runnerDependenciesToIgnore'

// Older shared ESLint configs require these packages as consumer-provided
// peers. Their imports can be hidden from Knip. Apply that compatibility list
// only to consumers declaring @syntopica/eslint-config; custom ESLint configs
// have their own imports and must not inherit these dependency exemptions.
// A peer of another installed dependency is already counted as used by Knip.
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
   * Binaries knip cannot resolve, merged with `gitleaks`. That one is ignored
   * by default because the baseline itself writes `gitleaks detect` into every
   * project's `secrets:check`, and it is a system binary no package provides,
   * so every template reported it as unlisted. Nothing else is: an entry for a
   * binary knip *can* resolve becomes a permanent `Remove from ignoreBinaries`
   * hint the consumer has no way to silence.
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
   * a replacement: matching preset globs stay, so a project cannot silently opt
   * out of scanning the directories the framework does own.
   *
   * Add a trailing `!` to a glob that holds runtime code
   * (`'components/**\/*.tsx!'`): `knip --production` analyses only marked
   * globs, so an unmarked one drops out of that run.
   */
  project?: string[]
  /**
   * Extra entry globs, merged with the framework preset's `entry`. Same
   * reasoning as `project`, for a root nobody's plugin registers - a worker,
   * a CLI, a script the app spawns. Missing preset files and unmatched preset
   * patterns are omitted. Caller patterns stay unchanged so a misspelled
   * custom path still produces a Knip hint.
   * Mark a runtime root with a trailing `!` (`'src/cli/main.ts!'`) so
   * `knip --production` starts from it too; leave scripts and tooling unmarked.
   */
  entry?: string[]
  /**
   * Whether an entry file's own exports are checked. Defaults per framework
   * (see FRAMEWORK_ENTRIES): true where the entries are hand-written, false
   * where the framework owns them. Set `false` for a package that is finished
   * but not wired up yet - with `true` its entire public API reports as unused
   * exports, and the obvious reading of that report is "delete this package".
   */
  includeEntryExports?: boolean
  /**
   * Set `false` to stop knip loading `drizzle.config.ts`. That file throws by
   * design when `DATABASE_URL` is unset, so the gate otherwise needs a live
   * database in CI. Adding the file to `ignore` does not stop the plugin -
   * only this does.
   */
  drizzle?: false
  /** The project root, for the checks that read it. Defaults to the cwd. */
  cwd?: string
}): KnipConfiguration => {
  const cwd = options.cwd ?? process.cwd()
  const hostedPeers = peersOfListedDependencies(cwd)
  const usesSharedEslint = readListedDependencies(cwd).includes(
    '@syntopica/eslint-config',
  )
  const { entry, project, includeEntryExports } =
    FRAMEWORK_ENTRIES[options.framework]

  return {
    entry: [...matchedPresetPatterns(entry, cwd), ...(options.entry ?? [])],
    project: [
      ...matchedPresetPatterns(project, cwd),
      ...(options.project ?? []),
      ...PRODUCTION_PROJECT_EXCLUSIONS,
    ],
    ...(options.ignore ? { ignore: options.ignore } : {}),
    ...(options.drizzle === false ? { drizzle: false } : {}),
    // Without this, exports of entry files are never checked, so a dead export
    // added to main.ts / index.ts would pass the gate. Coverage is real but
    // partial: verified with a probe export that it now fails `nestjs-app`
    // (src/main.ts) and `ts-package` (src/index.ts), and that it still does not
    // fail `nextjs-app` (app/page.tsx), `vite-react-app` (src/main.tsx) or
    // `vue-app` (src/main.ts) - files a knip framework plugin registers as an
    // entry of its own, which the option does not reach.
    includeEntryExports: options.includeEntryExports ?? includeEntryExports,
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
    ignoreBinaries: ['gitleaks', ...(options.ignoreBinaries ?? [])],
    ignoreDependencies: [
      ...runnerDependenciesToIgnore(cwd),
      ...(FRAMEWORK_RUNTIME_PACKAGES[options.framework] ?? []),
      ...ESLINT_PEER_DEPENDENCIES.filter(
        (dependency) => usesSharedEslint && !hostedPeers.has(dependency),
      ),
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
