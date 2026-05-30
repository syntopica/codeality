import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createCodeQualityConfig } from '@busirocket/eslint-config/code-quality'
import { createTailwindConfig } from '@busirocket/eslint-config/tailwind'
import { createViteVueConfig } from '@busirocket/eslint-config/vite-vue'
import prettier from 'eslint-config-prettier'
import path from 'node:path'

// Layer order: base → vite-vue (vue + a11y + boundaries) → code-quality → tailwind
export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createViteVueConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
  ...createTailwindConfig(),
  {
    files: ['**/*.{ts,vue}'],
    settings: {
      tailwindcss: {
        config: path.join(import.meta.dirname, 'src/styles.css'),
      },
    },
  },
  // Bootstrap/wiring files may hold multiple top-level statements.
  {
    files: ['src/main.ts', 'src/router/index.ts'],
    rules: {
      'code-policy/atomic-file': 'off',
    },
  },
  // Declaration files need `interface` for module augmentation and may use `any`.
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  // Vue composables are the Vue analogue of React hooks and live in composables/.
  {
    files: ['src/composables/**/*.ts'],
    rules: {
      'code-policy/file-kind-placement': 'off',
    },
  },
  // <script setup> bindings are not module exports; the rule does not apply to Vue SFCs.
  {
    files: ['**/*.vue'],
    rules: {
      'code-policy/no-hidden-top-level-declarations': 'off',
    },
  },
  // Disable formatting rules (incl. eslint-plugin-vue's) that conflict with Prettier. Must be last.
  prettier,
]
