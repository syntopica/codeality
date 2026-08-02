import vitest from '@vitest/eslint-plugin'
import testingLibrary from 'eslint-plugin-testing-library'

/**
 * Test-file rules. These catch what review misses in a green build: a
 * committed `.only` silently skipping the rest of the suite, a test with no
 * assertion, and Testing Library queries whose promises are never awaited.
 *
 * `eslint-plugin-vitest` is deprecated; `@vitest/eslint-plugin` is its
 * maintained successor.
 */
export const createTestingConfig = () => [
  {
    files: [
      '**/*.{test,spec}.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
      '**/test/**/*.{ts,tsx}',
    ],
    plugins: { vitest, 'testing-library': testingLibrary },
    rules: {
      'vitest/no-focused-tests': ['error', { fixable: false }],
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-identical-title': 'error',
      'vitest/expect-expect': 'error',
      'vitest/valid-expect': 'error',
      'vitest/no-conditional-expect': 'error',
      'testing-library/await-async-queries': 'error',
      'testing-library/await-async-utils': 'error',
      'testing-library/no-await-sync-queries': 'error',
      'testing-library/no-container': 'error',
      'testing-library/no-node-access': 'warn',
      'testing-library/prefer-screen-queries': 'error',
    },
  },
]
