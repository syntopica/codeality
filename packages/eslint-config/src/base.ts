/**
 * @repo/eslint-config — Shared base
 *
 * Scope: generic JS/TS correctness only.
 * No framework rules. No stylistic rules. No formatting rules.
 *
 * Framework extensions import this and compose on top.
 * Projects should never need to touch this directly.
 */

import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.next/**',
    '**/.astro/**',
    '**/out/**',
  ]),

  js.configs.recommended,
  // ---------------------------------------------------------------------------
  // TypeScript: strict type-aware rules
  // ---------------------------------------------------------------------------
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Hard correctness bans
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Promise correctness
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Maintainability
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // Disable base rule — TS version handles it correctly
      'no-unused-vars': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Import hygiene (correctness only — no sorting, no style)
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    settings: {
      'import/resolver': { typescript: true },
    },
    rules: {
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': ['error', { maxDepth: 1 }],

      // Unused imports — hard fail
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Unicorn: selected high-signal modern correctness rules only
  // Full unicorn recommended is too opinionated for a shared base.
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: { unicorn },
    rules: {
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      // These two are intentionally off at base level — too disruptive across codebases
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      // File naming: allow camelCase and PascalCase (framework templates vary)
      'unicorn/filename-case': [
        'error',
        { cases: { camelCase: true, pascalCase: true } },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // SonarJS: high-signal bug patterns only — noisy rules are downgraded
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: { sonarjs },
    rules: {
      ...sonarjs.configs?.recommended?.rules,
      // Downgrade opinionated / noisy SonarJS rules to warn
      'sonarjs/prefer-read-only-props': 'warn',
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/pseudo-random': 'warn',
      'sonarjs/deprecation': 'warn',
      'sonarjs/slow-regex': 'warn',
      'sonarjs/no-nested-functions': 'warn',
      'sonarjs/no-duplicate-string': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Prettier last — disables all formatting-related lint rules
  // ---------------------------------------------------------------------------
  prettier,
])
