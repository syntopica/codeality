import type { IConfiguration } from 'dependency-cruiser'

/**
 * Graph-level architecture rules. Complements ESLint: `import/no-cycle` runs
 * per file and cannot resolve across package boundaries, while this runs over
 * the whole resolved module graph.
 */
export const createDepCruiserConfig = (
  options: { tsConfigPath?: string } = {},
): IConfiguration => ({
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'Cycles make modules impossible to reason about or test in isolation.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'error',
      comment:
        'A module nothing imports and that is not an entry point is dead weight.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          // Framework/tooling config files: loaded directly by that tool's
          // own runtime, never imported by application code. Being an
          // orphan in the module graph is their normal state, not a defect.
          '(^|/)(babel|webpack|vite|vitest|eslint|knip|prettier|tsup|astro|next|nuxt)\\.config\\.(js|cjs|mjs|ts)$',
          // Next.js App Router special files (sitemap, robots, ...) are
          // loaded directly by Next's build process by filename convention,
          // never imported by application code.
          '(^|/)app/(sitemap|robots)\\.tsx?$',
          // ESLint rule test fixtures: read from disk by filename in
          // RuleTester cases, never imported as real modules. Being
          // unreferenced in the graph is their intended state.
          '(^|/)tests/fixtures/',
          // `@/` path-alias imports are resolved per package via that
          // package's own tsconfig.json "paths". A single repo-wide
          // dependency-cruiser run has no per-package tsconfig awareness
          // (and pointing it at one package's tsconfig would incorrectly
          // apply that package's alias mapping to every other cruised
          // file), so these aliased imports resolve as `couldNotResolve`
          // and their real targets show up as false orphans. Verified with
          // `depcruise --output-type json` that every listed file has a
          // real `@/`-aliased importer.
          '^packages/eslint-plugin-code-policy/src/(utils/|version\\.ts$)',
          '^templates/vue-app/src/(types/|stores/|App\\.vue$)',
          '^templates/nuxt-app/app/(types/|pages/|app\\.vue$)',
        ],
      },
      to: {},
    },
    {
      name: 'packages-must-not-depend-on-templates',
      severity: 'error',
      comment:
        'Templates are scaffolding output. A shared package reaching into one inverts the dependency.',
      from: { path: '^packages/' },
      to: { path: '^templates/' },
    },
    {
      name: 'no-dev-dep-in-production-code',
      severity: 'warn',
      comment:
        'A devDependency imported by shipped code will be missing at runtime for consumers.',
      from: { path: '^packages/[^/]+/src/', pathNot: '\\.(test|spec)\\.ts$' },
      to: { dependencyTypes: ['npm-dev'] },
    },
    {
      name: 'no-deprecated-core',
      severity: 'error',
      comment: 'Deprecated Node core modules are removed in future majors.',
      from: {},
      to: { dependencyTypes: ['core'], path: '^(punycode|domain|sys)$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: '(^|/)(dist|coverage|\\.next|\\.nuxt|\\.output|\\.astro|target)/',
    },
    tsPreCompilationDeps: true,
    tsConfig: options.tsConfigPath
      ? { fileName: options.tsConfigPath }
      : undefined,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue'],
    },
  },
})
