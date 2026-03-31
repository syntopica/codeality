/**
 * @repo/eslint-config — Astro extension
 *
 * Composes on top of the shared base.
 * Adds: Astro plugin, .astro parser, Astro-specific correctness rules,
 * and the server/client boundary map for src/-based Astro projects.
 *
 * Usage:
 *   import base from '@repo/eslint-config/base'
 *   import astro from '@repo/eslint-config/astro'
 *   export default [...base, ...astro]
 */

import astroPlugin from 'eslint-plugin-astro'
import boundaries from 'eslint-plugin-boundaries'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist/**', '.astro/**', 'coverage/**']),

  ...astroPlugin.configs.recommended,

  // Astro files: enable TS parser inside front-matter
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        project: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      'astro/no-set-html-directive': 'error',
      'astro/no-unused-define-vars-in-style': 'error',
      'astro/no-conflict-set-directives': 'error',
      'astro/no-exports-from-components': 'error',
    },
  },

  // TS files inside Astro project: type-aware rules
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
    },
  },

  // Architecture boundary governance for src/-based Astro projects
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs,astro}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'pages',    pattern: 'src/pages/*' },
        { type: 'layouts',  pattern: 'src/layouts/*' },
        { type: 'features', pattern: 'src/features/*' },
        { type: 'shared',   pattern: 'src/shared/*' },
        { type: 'server',   pattern: 'src/server/*' },
        { type: 'public',   pattern: 'src/public/*' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: ['pages'],    allow: ['features', 'shared', 'public', 'server', 'layouts'] },
            { from: ['layouts'],  allow: ['shared', 'public', 'features'] },
            { from: ['features'], allow: ['features', 'shared', 'public', 'server'] },
            { from: ['shared'],   allow: ['shared', 'public'] },
            { from: ['public'],   allow: ['public', 'shared'] },
            { from: ['server'],   allow: ['server', 'shared'] },
          ],
        },
      ],
    },
  },

  // Declaration files: allow triple-slash references
  {
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/triple-slash-reference': 'off' },
  },
])
