/**
 * @repo/eslint-config — Next.js extension
 *
 * Composes on top of the shared base.
 * Adds: Next.js flat configs, React hooks, server/client boundary enforcement.
 *
 * Usage in a Next.js project:
 *   import base from '@repo/eslint-config/base'
 *   import nextjs from '@repo/eslint-config/nextjs'
 *   export default [...base, ...nextjs, ...localArchitecture]
 */

import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import boundaries from 'eslint-plugin-boundaries'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig, globalIgnores } from 'eslint/config'

// Reuse the import plugin instance registered by eslint-config-next
// to avoid "Cannot redefine plugin" errors.
type PluginRecord = Record<string, unknown>
const allNextConfigs = [...nextVitals, ...nextTs].flat(Infinity as 10)
const importPlugin = allNextConfigs.flatMap((c) => {
  if (c && typeof c === 'object' && 'plugins' in c) {
    const plugins = (c as { plugins?: PluginRecord }).plugins
    if (plugins && typeof plugins === 'object' && 'import' in plugins) {
      return [plugins['import']]
    }
  }
  return []
})[0] as PluginRecord | undefined

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'coverage/**',
    'next-env.d.ts',
  ]),

  { settings: { react: { version: 'detect' } } },

  // Type-aware TS rules for Next.js (projectService)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          // Allow config files that are outside the tsconfig include glob
          allowDefaultProject: ['eslint.config.ts', 'next.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      } as never,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },

  // Import hygiene — reusing Next's import plugin instance
  ...(importPlugin
    ? [
        {
          files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'] as [string],
          plugins: { import: importPlugin, 'unused-imports': unusedImports },
          settings: { 'import/resolver': { typescript: true } },
          rules: {
            'import/first': 'error' as const,
            'import/newline-after-import': 'error' as const,
            'import/no-duplicates': 'error' as const,
            'import/no-self-import': 'error' as const,
            'import/no-cycle': ['error', { maxDepth: 1 }] as ['error', { maxDepth: number }],
            'unused-imports/no-unused-imports': 'error' as const,
            'unused-imports/no-unused-vars': [
              'error',
              { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
            ] as const,
          },
        },
      ]
    : []),

  // Architecture boundary governance (folder-level)
  // Adjust boundaries/elements in your project's eslint.architecture.ts.
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'app/*' },
        { type: 'app', pattern: 'app/**/*' },
        { type: 'components', pattern: 'components/*' },
        { type: 'components', pattern: 'components/**/*' },
        { type: 'shared', pattern: 'lib/*' },
        { type: 'shared', pattern: 'hooks/*' },
        { type: 'shared', pattern: 'types/*' },
        { type: 'shared', pattern: 'store/*' },
        { type: 'server', pattern: 'services/*' },
        { type: 'server', pattern: 'actions/*' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: ['app'], allow: ['components', 'shared', 'server'] },
            { from: ['components'], allow: ['components', 'shared'] },
            { from: ['shared'], allow: ['shared'] },
            { from: ['server'], allow: ['server', 'shared'] },
          ],
        },
      ],
    },
  },
])
