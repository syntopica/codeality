import type { IConfiguration, IForbiddenRuleType } from 'dependency-cruiser'

// Orphan exemptions that hold at either scope. Every pattern is anchored on a
// path segment rather than the repo root, so it matches whether the cruise runs
// from the repo root or from inside a single workspace.
const ORPHAN_EXEMPTIONS = [
  '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
  '\\.d\\.ts$',
  '(^|/)tsconfig\\.json$',
  // Framework/tooling config files: loaded directly by that tool's own
  // runtime, never imported by application code. Being an orphan in the module
  // graph is their normal state, not a defect.
  '(^|/)(babel|webpack|vite|vitest|eslint|knip|prettier|tsup|astro|next|nuxt)\\.config\\.(js|cjs|mjs|ts)$',
  // Next.js App Router special files (sitemap, robots, ...) are loaded
  // directly by Next's build process by filename convention, never imported by
  // application code.
  '(^|/)app/(sitemap|robots)\\.tsx?$',
  // Nuxt file-convention entry points: app.vue is the framework's root
  // component and everything under pages/ is resolved by Nuxt's file-based
  // router. Both are loaded directly by Nuxt's build/runtime, not by any
  // application import (verified with `depcruise --output-type json`: zero
  // dependencies AND zero dependents), so having no importer is their normal
  // state.
  '(^|/)app/(app\\.vue$|pages/)',
  // ESLint rule test fixtures: read from disk by filename in RuleTester cases,
  // never imported as real modules. Being unreferenced in the graph is their
  // intended state.
  '(^|/)tests/fixtures/',
]

// Rules that need the whole resolved graph and cannot be split per workspace:
// a cycle or a packages -> templates edge can span two workspaces, and
// `no-dev-dep-in-production-code` matches on a repo-relative path prefix.
const REPO_SCOPE_RULES: IForbiddenRuleType[] = [
  {
    name: 'no-circular',
    severity: 'error',
    comment:
      'Cycles make modules impossible to reason about or test in isolation.',
    from: {},
    to: { circular: true },
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
]

/**
 * Graph-level architecture rules. Complements ESLint: `import/no-cycle` runs
 * per file and cannot resolve across package boundaries, while this runs over
 * the whole resolved module graph.
 *
 * `scope: 'repo'` (the default) cruises the whole repository and owns every
 * rule that needs the full graph. `scope: 'workspace'` cruises one workspace
 * and owns only the orphan check, the one rule whose correctness depends on
 * alias resolution.
 *
 * A workspace-scoped cruise needs a `--ts-config` whose `paths` are written
 * relative to the workspace root: dependency-cruiser resolves them against the
 * current working directory rather than against the config file that declares
 * them, so a config that lives one directory down (a framework-generated one,
 * for instance) mis-resolves every alias.
 *
 * `orphanExemptions` adds project-specific `no-orphans` exemptions on top of
 * the framework-convention ones built in here. Use it for directories a
 * repo-wide run cannot judge - typically a workspace whose path aliases only
 * resolve under its own tsconfig, cruised separately at `scope: 'workspace'`.
 */
export const createDepCruiserConfig = (
  options: {
    tsConfigPath?: string
    scope?: 'repo' | 'workspace'
    orphanExemptions?: string[]
  } = {},
): IConfiguration => ({
  forbidden: [
    {
      name: 'no-orphans',
      severity: 'error',
      comment:
        'A module nothing imports and that is not an entry point is dead weight.',
      from: {
        orphan: true,
        pathNot: [...ORPHAN_EXEMPTIONS, ...(options.orphanExemptions ?? [])],
      },
      to: {},
    },
    ...(options.scope === 'workspace' ? [] : REPO_SCOPE_RULES),
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
