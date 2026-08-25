/**
 * Structural enforcement: atomic files, no inline types, view/hook split, import policy.
 * Complexity + size: max-lines (100 hard cap), max-lines-per-function, cyclomatic complexity.
 *
 * Full rationale: docs/standards/code-quality.md and
 * docs/standards/typescript-frontend-architecture.md
 */

import codePolicy from 'eslint-plugin-code-policy'

import { createCodeQualitySonarConfig } from './code-quality-sonar'
import { createTestingConfig } from './testing'

export const createCodeQualityConfig = () => [
  codePolicy.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'max-lines': [
        'error',
        { max: 100, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'warn',
        { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ['warn', { max: 10 }],
      'max-depth': ['warn', { max: 4 }],
      'max-params': ['warn', { max: 4 }],
    },
  },
  ...createCodeQualitySonarConfig(),
  ...createTestingConfig(),
  // Tooling and framework entrypoints are allowed to exceed the default file budget.
  {
    files: [
      '**/*.config.{ts,js,mjs,cjs}',
      '**/eslint.config.*',
      '**/*.setup.{ts,tsx}',
      '**/next-env.d.ts',
      '**/vitest.config.*',
      '**/playwright.config.*',
    ],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
  {
    // Globs match createTestingConfig()'s: a helper under `tests/` or `test/`
    // that is not itself named `*.test.ts` is still test scaffolding and must
    // be judged by the same policy, not by the production one.
    files: [
      '**/*.{test,spec}.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
      '**/tests/**/*.{ts,tsx}',
      '**/test/**/*.{ts,tsx}',
    ],
    rules: {
      // Tests get a real budget, not an exemption. 200 is deliberately looser
      // than production's 100 - a test file carries arrange scaffolding its
      // subject does not - but it is still a budget: past 200 lines a test
      // file is covering more than one behaviour and should be split by
      // behaviour, which is also what makes a failure easy to locate.
      'max-lines': [
        'error',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      // Off, not relaxed. In a test file the longest "function" is the
      // top-level `describe` callback, so this rule measures the wrapper
      // rather than any real complexity: 20 trivial `it` cases already report
      // a 62-line arrow. Leaving it on would contradict the 200-line budget
      // above and push authors to split `describe` blocks for no reason.
      // File size is governed by max-lines; per-case size by review.
      'max-lines-per-function': 'off',
      // Placement stays enforced: it costs no extra code and it is what keeps
      // a shared fixture findable. Detection is camelCase-prefix based
      // (`useX`, `formatX`, `mapX`, ...), so a test colocated with its
      // subject inherits the subject's folder and passes; what this actually
      // forbids is the `tests/utils/` + `tests/helpers/` junk drawer.
      'code-policy/file-kind-placement': 'error',
      // Test files legitimately colocate inline fixture types, builders, and
      // local helpers next to the cases that use them; the atomic-file/one-unit
      // discipline targets production architecture, not test scaffolding.
      // Enforcing these three would mean writing twice the code for the same
      // tests - every local builder would have to be exported or extracted.
      'code-policy/no-inline-types-in-runtime-files': 'off',
      'code-policy/no-hidden-top-level-declarations': 'off',
      'code-policy/one-primary-unit': 'off',
    },
  },
  // Next.js App Router special files often coordinate wiring and metadata.
  {
    files: [
      '**/app/**/page.tsx',
      '**/app/**/layout.tsx',
      '**/app/**/loading.tsx',
      '**/app/**/error.tsx',
      '**/app/**/not-found.tsx',
      '**/app/**/route.ts',
      '**/app/**/template.tsx',
      '**/app/**/default.tsx',
      '**/src/app/**/page.tsx',
      '**/src/app/**/layout.tsx',
      '**/src/app/**/loading.tsx',
      '**/src/app/**/error.tsx',
      '**/src/app/**/not-found.tsx',
      '**/src/app/**/route.ts',
      '**/src/app/**/template.tsx',
      '**/src/app/**/default.tsx',
    ],
    rules: {
      'max-lines': [
        'warn',
        { max: 120, skipBlankLines: true, skipComments: true },
      ],
    },
  },
]
