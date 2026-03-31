/**
 * @repo/eslint-config — Node.js / tooling extension
 *
 * Composes on top of the shared base.
 * Adds: Node globals, node-specific unicorn rules.
 * Use this for scripts, CLI tools, server-only packages (no DOM).
 *
 * Usage:
 *   import base from '@repo/eslint-config/base'
 *   import node from '@repo/eslint-config/node'
 *   export default [...base, ...node]
 */

import globals from 'globals'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.{ts,js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // Enforce the node: protocol for built-in imports
      'unicorn/prefer-node-protocol': 'error',
    },
  },
])
