/**
 * Structural enforcement: atomic files, no inline types, view/hook split, import policy.
 * Complexity + size: max-lines (100 hard cap), max-lines-per-function, cyclomatic complexity.
 *
 * Full rationale: docs/standards/code-quality.md and
 * docs/standards/typescript-frontend-architecture.md
 */

import codePolicy from 'eslint-plugin-code-policy'

import { createCodeQualitySonarConfig } from './code-quality-sonar'

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
    files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'warn',
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

export default createCodeQualityConfig
