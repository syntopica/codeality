import type { KnipConfig } from 'knip'

// Templates are scaffolding: their exports are consumed by the projects
// generated from them, not from inside this repo. Only dependency findings
// are meaningful here.
const TEMPLATE_GLOB = ['**/*.{ts,tsx,vue,astro}']

// Each template installs these as peer dependencies of
// @busirocket/eslint-config: the config factories (base.ts and friends)
// `import` them by bare specifier, and pnpm's isolated node_modules needs
// each consumer to declare them directly for that import to resolve. No
// template file ever imports these packages itself (they only import from
// '@busirocket/eslint-config/*'), so knip can't see the real caller and
// reports them as unused.
const TEMPLATE_ESLINT_PEER_DEPENDENCIES = [
  '@eslint/js',
  'eslint-config-prettier',
  'eslint-plugin-promise',
  'eslint-plugin-security',
  'eslint-plugin-unused-imports',
  'typescript-eslint',
]

// The tools @busirocket/quality-config's runners spawn through `pnpm exec`:
// `baseline-dupes` spawns `jscpd`, `baseline-type-coverage` spawns
// `type-coverage`. A template declares the dependency because the runner
// spawns the binary rather than vendoring it, but nothing in the template
// names it where knip can see. Mirrors BASELINE_RUNNER_DEPENDENCIES in that
// package's own knip factory, which covers the per-template gate a scaffolded
// project runs.
const TEMPLATE_RUNNER_DEPENDENCIES = ['jscpd', 'type-coverage']

const config: KnipConfig = {
  workspaces: {
    '.': {
      entry: ['scripts/*.mjs'],
      project: ['scripts/*.mjs'],
      // @busirocket/quality-config is a real dependency of the root
      // .dependency-cruiser.cjs, but it's loaded through
      // `jiti('@busirocket/quality-config/dependency-cruiser')` — a
      // dynamic string argument, not a static import/require knip's
      // analysis can trace back to the package.
      ignoreDependencies: ['@busirocket/quality-config'],
    },
    'packages/*': {
      entry: ['src/index.ts', 'src/*.ts', 'bin/*.mjs'],
      project: ['src/**/*.ts'],
    },
    'packages/eslint-plugin-code-policy': {
      // A workspace-specific key replaces rather than merges with the
      // `packages/*` wildcard, so entry/project are repeated here.
      entry: ['src/index.ts', 'src/*.ts'],
      // This is the one package whose tests live outside `src`. They are in
      // scope so the dependencies only they pull in (the parser the rule
      // tester runs on) count as used instead of being reported as unused
      // devDependencies; knip's vitest plugin supplies the test files
      // themselves as entry points.
      project: ['src/**/*.ts', 'tests/**/*.ts'],
      // Fixtures are read from disk by path, never imported, so knip cannot
      // see a consumer and reports every one of them as an unused file. They
      // live at the package root, not under tests/, because file-kind-placement
      // exempts test scope and would otherwise exempt every fixture.
      ignore: ['fixtures/**'],
      // @busirocket/eslint-config ships TypeScript source, so the plugins its
      // base config `require()`s resolve from whichever package composes it -
      // this one included. knip sees the import in eslint-config and the
      // dependency here, and cannot connect them.
      ignoreDependencies: ['eslint-plugin-regexp'],
    },
    'templates/*': {
      entry: TEMPLATE_GLOB,
      project: TEMPLATE_GLOB,
      ignoreDependencies: [
        ...TEMPLATE_RUNNER_DEPENDENCIES,
        ...TEMPLATE_ESLINT_PEER_DEPENDENCIES,
      ],
    },
    'templates/nuxt-app': {
      // A workspace-specific key replaces rather than merges with the
      // `templates/*` wildcard entry, so entry/project/ignoreDependencies are
      // repeated here rather than inherited.
      entry: TEMPLATE_GLOB,
      project: TEMPLATE_GLOB,
      ignoreDependencies: [
        ...TEMPLATE_RUNNER_DEPENDENCIES,
        ...TEMPLATE_ESLINT_PEER_DEPENDENCIES,
        // vitest-environment-nuxt is a real dependency, not a false
        // positive: templates/nuxt-app/knip.config.ts (the per-template
        // gate a project scaffolded from this template runs) requires it
        // declared, because app/components/TheCounter.test.ts carries a
        // `// @vitest-environment nuxt` pragma that needs the package
        // resolvable. It is invisible to this root config specifically
        // because `vitest: false` below disables the plugin that would
        // otherwise see that pragma and count the dependency as used.
        'vitest-environment-nuxt',
      ],
      // .nuxt/**  is Nuxt's generated type cache (rebuilt by `nuxt prepare`
      // on every install). Its .d.ts files reference Nuxt's internal modules
      // (nitropack, @nuxt/devtools, vue-router, ...) which are never meant to
      // be direct dependencies of the app; scanning generated output as
      // source produces dozens of unlisted-dependency false positives.
      ignore: ['.nuxt/**'],
      // knip's vitest plugin tries to load vitest.config.ts to introspect it,
      // and that load fails to resolve `@nuxt/kit` through pnpm's nested
      // store even though Node resolves it fine at runtime (a known knip/jiti
      // loader limitation, see https://knip.dev/reference/known-issues).
      // Disabling the plugin avoids the crash; the broad entry glob above
      // still covers vitest.config.ts and the test files it points to.
      vitest: false,
    },
  },
  ignoreBinaries: [
    'turbo',
    'lhci',
    'gitleaks',
    'actionlint',
    // `typescript` is installed under the npm alias `@typescript/typescript6`
    // repo-wide (the TS7 native-compiler trial), so knip can't map the `tsc`
    // binary in package.json scripts back to a declared dependency name.
    'tsc',
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

export default config
