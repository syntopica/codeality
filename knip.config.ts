import type { KnipConfig } from 'knip'

// Templates are scaffolding: their exports are consumed by the projects
// generated from them, not from inside this repo. Only dependency findings
// are meaningful here, so every source file is an entry.
//
// The trailing `!` marks them as production code for `knip --production`,
// minus the tests and the build configuration that never ship; the default run
// strips the marks and ignores the `!...!` negations, so it sees every source
// file, tests included. Package `src/` and `bin/` patterns below carry the same
// mark; their `tests/` globs do not, so production mode leaves tests out.
const TEMPLATE_GLOB = [
  '**/*.{ts,tsx}!',
  '!**/*.{test,spec}.{ts,tsx}!',
  '!**/{vite,vitest,playwright,astro,nuxt,next,tailwind,postcss,eslint,knip}.config.*!',
]

// Each template installs these as peer dependencies of
// @syntopica/eslint-config: the config factories (base.ts and friends)
// `import` them by bare specifier, and pnpm's isolated node_modules needs
// each consumer to declare them directly for that import to resolve. No
// template file ever imports these packages itself (they only import from
// '@syntopica/eslint-config/*'), so knip can't see the real caller and
// reports them as unused.
const TEMPLATE_ESLINT_PEER_DEPENDENCIES = [
  '@eslint/js',
  'eslint-config-prettier',
  'eslint-plugin-promise',
  'eslint-plugin-security',
  'eslint-plugin-unused-imports',
  'typescript-eslint',
]

// The tools @syntopica/quality-config's runners spawn through `pnpm exec`:
// `baseline-dupes` spawns `jscpd`, `baseline-type-coverage` spawns
// `type-coverage`, `baseline-hooks-install` spawns `lefthook`. A template
// declares the dependency because the runner spawns the binary rather than
// vendoring it, but nothing in the template names it where knip can see. Mirrors BASELINE_RUNNER_DEPENDENCIES in that
// package's own knip factory, which covers the per-template gate a scaffolded
// project runs.
const TEMPLATE_RUNNER_DEPENDENCIES = ['jscpd', 'type-coverage', 'lefthook']

const config: KnipConfig = {
  workspaces: {
    '.': {
      entry: ['scripts/*.mjs'],
      project: ['scripts/*.mjs'],
      // The baseline runners spawn these tools outside Knip's script graph.
      ignoreDependencies: ['jscpd', 'type-coverage'],
    },
    'packages/*': {
      entry: ['src/*.ts!', 'bin/*.mjs!'],
      project: ['src/**/*.ts!'],
    },
    'packages/create-baseline': {
      entry: ['bin/*.mjs!'],
      project: ['bin/**/*.mjs!', 'tests/**/*.mjs'],
    },
    'packages/eslint-config': {
      entry: ['src/*.ts!'],
      project: ['src/**/*.ts!'],
    },
    'packages/prettier-config': {
      entry: ['*.mjs!'],
      project: ['*.mjs!', 'tests/**/*.mjs'],
    },
    'packages/tsconfig': {
      // nextjs.json declares the Next TypeScript plugin by name, which knip
      // reads as an import. The preset is for consumers that install Next
      // themselves; this package must not depend on it.
      ignoreUnresolved: ['next'],
    },
    'packages/eslint-plugin-code-policy': {
      // A workspace-specific key replaces rather than merges with the
      // `packages/*` wildcard, so entry/project are repeated here.
      entry: ['src/*.ts!'],
      // This is the one package whose tests live outside `src`. They are in
      // scope so the dependencies only they pull in (the parser the rule
      // tester runs on) count as used instead of being reported as unused
      // devDependencies; knip's vitest plugin supplies the test files
      // themselves as entry points.
      project: ['src/**/*.ts!', 'tests/**/*.ts'],
      // @syntopica/eslint-config ships TypeScript source, so the plugins its
      // base config `require()`s resolve from whichever package composes it -
      // this one included. knip sees the import in eslint-config and the
      // dependency here, and cannot connect them.
      ignoreDependencies: ['eslint-plugin-regexp'],
    },
    'packages/gate-kit': {
      // Consumed through the `./*` export map by the gate CLIs, which bundle it.
      entry: ['src/*.ts!'],
      project: ['src/**/*.ts!', 'tests/**/*.ts'],
    },
    'packages/ui-quality': {
      entry: ['bin/*.mjs!', 'tsup.probe.config.ts', 'assets/probe.js!'],
      project: [
        'src/**/*.ts!',
        'tests/**/*.ts',
        'tsup.probe.config.ts',
        'assets/probe.js!',
      ],
    },
    'packages/test-quality': {
      // The inventory probe in assets/ is run with node inside the audited
      // project, so knip sees it only as an entry.
      entry: ['src/cli.ts!', 'bin/*.mjs!', 'assets/*.mjs!'],
      project: ['src/**/*.ts!', 'tests/**/*.ts'],
    },
    'packages/db-quality': {
      // A workspace-specific key replaces rather than merges with the
      // `packages/*` wildcard, so entry/project are repeated here.
      entry: ['bin/*.mjs!'],
      project: ['src/**/*.ts!', 'tests/**/*.ts'],
      // The adapters spawn these as executables through the command runner
      // (`runSquawk` -> squawk, `runPrismaLint` -> prisma-lint) or load them
      // from the shipped ESLint config in assets/, which knip does not parse
      // (`runDrizzleLint` -> eslint-plugin-drizzle and typescript-eslint).
      // They are devDependencies so the integration tests run the real
      // tools, and optional peers so a consumer installs only its own.
      ignoreDependencies: [
        'eslint-plugin-drizzle',
        'prisma-lint',
        'squawk-cli',
      ],
      // `sqlite3` is the system shell the sqlite adapter spawns; the
      // integration test calls it directly to build a fixture database.
      ignoreBinaries: ['sqlite3'],
      // The postgrest fixtures are read from disk by path (readFileSync)
      // and parsed with the TypeScript compiler API, never imported, so
      // knip cannot see a consumer of chains.ts and reports it as an
      // unused file. Same reasoning as eslint-plugin-code-policy's
      // `fixtures/**` ignore above.
      ignore: ['tests/fixtures/postgrest/**'],
    },
    'templates/*': {
      entry: TEMPLATE_GLOB,
      project: TEMPLATE_GLOB,
      ignoreDependencies: [
        ...TEMPLATE_RUNNER_DEPENDENCIES,
        ...TEMPLATE_ESLINT_PEER_DEPENDENCIES,
      ],
    },
    'templates/vite-react-app': {
      entry: ['**/*.{ts,tsx,css}!', ...TEMPLATE_GLOB.slice(1)],
      project: ['**/*.{ts,tsx,css}!', ...TEMPLATE_GLOB.slice(1)],
      ignoreDependencies: [
        ...TEMPLATE_RUNNER_DEPENDENCIES,
        ...TEMPLATE_ESLINT_PEER_DEPENDENCIES.filter(
          (dependency) => dependency !== 'eslint-config-prettier',
        ),
      ],
    },
    'templates/tauri-app': {
      entry: ['**/*.{ts,tsx,css}!', ...TEMPLATE_GLOB.slice(1)],
      project: ['**/*.{ts,tsx,css}!', ...TEMPLATE_GLOB.slice(1)],
      ignoreDependencies: [
        ...TEMPLATE_RUNNER_DEPENDENCIES,
        ...TEMPLATE_ESLINT_PEER_DEPENDENCIES.filter(
          (dependency) => dependency !== 'eslint-config-prettier',
        ),
      ],
    },
    'templates/vue-app': {
      entry: ['**/*.{ts,tsx,vue,css}!', ...TEMPLATE_GLOB.slice(1)],
      project: ['**/*.{ts,tsx,vue,css}!', ...TEMPLATE_GLOB.slice(1)],
      ignoreDependencies: [
        ...TEMPLATE_RUNNER_DEPENDENCIES,
        ...TEMPLATE_ESLINT_PEER_DEPENDENCIES.filter(
          (dependency) => dependency !== 'eslint-config-prettier',
        ),
      ],
    },
    'templates/astro-site': {
      entry: ['**/*.{ts,tsx,astro}!', ...TEMPLATE_GLOB.slice(1)],
      project: ['**/*.{ts,tsx,astro}!', ...TEMPLATE_GLOB.slice(1)],
      ignoreDependencies: [
        ...TEMPLATE_RUNNER_DEPENDENCIES,
        ...TEMPLATE_ESLINT_PEER_DEPENDENCIES.filter(
          (dependency) => dependency !== 'typescript-eslint',
        ),
      ],
    },
    'templates/nuxt-app': {
      // A workspace-specific key replaces rather than merges with the
      // `templates/*` wildcard entry, so entry/project/ignoreDependencies are
      // repeated here rather than inherited.
      entry: ['**/*.{ts,tsx,vue,css}!', ...TEMPLATE_GLOB.slice(1)],
      project: ['**/*.{ts,tsx,vue,css}!', ...TEMPLATE_GLOB.slice(1)],
      ignoreDependencies: [
        ...TEMPLATE_RUNNER_DEPENDENCIES,
        ...TEMPLATE_ESLINT_PEER_DEPENDENCIES.filter(
          (dependency) =>
            dependency !== 'eslint-config-prettier' &&
            dependency !== 'typescript-eslint',
        ),
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
  ignoreBinaries: ['gitleaks', 'actionlint'],
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
