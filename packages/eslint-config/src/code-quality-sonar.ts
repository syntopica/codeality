import sonarjs from 'eslint-plugin-sonarjs'

/** Duplication and smell rules from eslint-plugin-sonarjs. Composed by code-quality. */
export const createCodeQualitySonarConfig = () => [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { sonarjs },
    rules: {
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-duplicate-string': ['warn', { threshold: 4 }],
      // Cyclomatic `complexity` counts branches; this counts how hard the
      // branching is to hold in your head, so nesting costs more than a flat
      // sequence of guards. The two disagree in the direction that matters:
      // a function with ten early returns is easy and scores 10 on
      // cyclomatic, while three nested loops with a condition each is hard
      // and scores 4. 15 is SonarSource's own default.
      // `error`, not `warn`, and the difference is not severity: every lint
      // script runs with --max-warnings 0, so a warning fails the build
      // anyway. ESLint's bulk suppressions only apply to errors, and existing
      // debt has to be expressible as `eslint-suppressions.json` - a file
      // review can see and `lint:prune` can shrink - rather than as a raised
      // threshold nobody ever lowers again.
      'sonarjs/cognitive-complexity': ['error', 15],
    },
  },
]
