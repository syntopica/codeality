/**
 * @repo/eslint-config — Vite + React extension
 *
 * Composes on top of the shared base.
 * Adds: react-hooks, react-refresh (for HMR correctness during dev).
 *
 * Usage:
 *   import base from '@repo/eslint-config/base'
 *   import viteReact from '@repo/eslint-config/vite-react'
 *   export default [...base, ...viteReact]
 */

import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React Hooks correctness — mandatory
      ...reactHooks.configs.recommended.rules,

      // HMR correctness: warn when a non-component is exported from a component file
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
