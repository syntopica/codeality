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
          '(^|/)(babel|webpack|vite|vitest|eslint|knip)\\.config\\.(js|cjs|mjs|ts)$',
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
