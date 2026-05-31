import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'

import { createFrontendBoundariesConfig } from './frontend-boundaries'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pluginVue = require('eslint-plugin-vue') as {
  configs: Record<string, unknown[]>
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vueA11y = require('eslint-plugin-vuejs-accessibility') as {
  configs: Record<string, unknown[]>
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vueParser = require('vue-eslint-parser') as {
  parseForESLint: (...args: unknown[]) => unknown
}

export type ViteVueConfigOptions = {
  tsconfigRootDir?: string
}

/**
 * Vue 3 SFC linting layer for Vite apps.
 *
 * - eslint-plugin-vue `flat/recommended` (highest priority tier: essential +
 *   strongly-recommended + recommended).
 * - eslint-plugin-vuejs-accessibility `flat/recommended` (jsx-a11y does not lint
 *   `.vue` SFCs, so Vue gets its own a11y layer here).
 * - `.vue` files parsed by vue-eslint-parser with typescript-eslint as the
 *   `<script lang="ts">` parser (type-aware via projectService).
 * - Reuses the shared frontend import boundaries.
 */
export const createViteVueConfig = (options: ViteVueConfigOptions = {}) => {
  const tsconfigRootDir = options.tsconfigRootDir ?? process.cwd()
  const vueRecommended = pluginVue.configs['flat/recommended'] ?? []
  const a11yRecommended = vueA11y.configs['flat/recommended'] ?? []

  return [
    ...vueRecommended,
    ...a11yRecommended,
    {
      files: ['**/*.vue'],
      languageOptions: {
        parser: vueParser,
        parserOptions: {
          parser: tseslint.parser,
          projectService: true,
          tsconfigRootDir,
          extraFileExtensions: ['.vue'],
          ecmaVersion: 2024,
          sourceType: 'module',
        },
      },
      plugins: {
        'unused-imports': unusedImports,
      },
      rules: {
        // TypeScript (not core ESLint) resolves identifiers inside `<script
        // setup lang="ts">`; core `no-undef` cannot see ambient/global types and
        // would false-positive on them. typescript-eslint disables it for .ts
        // for the same reason — mirror that for .vue SFCs.
        'no-undef': 'off',
        // Unused-binding handling consistent with the .ts layer: defer to
        // unused-imports with the `_`-prefix escape hatch.
        'no-unused-vars': 'off',
        'unused-imports/no-unused-vars': [
          'error',
          {
            args: 'after-used',
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
        // raw HTML binding is an XSS vector
        'vue/no-v-html': 'error',
        // force the type-based defineProps<...>() form
        'vue/define-props-declaration': ['error', 'type-based'],
        // refs must carry a type when it cannot be inferred
        'vue/require-typed-ref': 'error',
        // multi-word component names (root App is the conventional exception)
        'vue/multi-word-component-names': ['error', { ignores: ['App'] }],
      },
    },
    ...createFrontendBoundariesConfig(),
  ]
}

export default createViteVueConfig
