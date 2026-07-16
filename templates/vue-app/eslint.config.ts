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
  ...createTailwindConfig({ cssConfigPath: './src/styles.css' }),
  {
    files: ['**/*.{ts,vue}'],
    settings: {
      tailwindcss: {
        config: path.join(import.meta.dirname, 'src/styles.css'),
      },
    },
  },
  // Declaration files require `interface` for module augmentation (Vite env,
  // vitest matchers) and mirror upstream `any` generics — language constraints.
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  // `<script setup>` top-level bindings are the component's reactive state, not
  // module-level helpers — the hidden-declaration rule does not apply to SFCs.
  {
    files: ['**/*.vue'],
    rules: {
      'code-policy/no-hidden-top-level-declarations': 'off',
    },
  },
  // Vue composables are the framework analogue of React hooks and live in the
  // conventional `composables/` folder; the placement rule is hook/React-centric.
  // Pinia stores follow the same `useXxxStore` naming but live in `stores/` (or
  // `store/`), not `hooks/` — exempt them from the hook-placement rule too.
  {
    files: [
      'src/composables/**/*.ts',
      'src/stores/**/*.ts',
      'src/store/**/*.ts',
    ],
    rules: {
      'code-policy/file-kind-placement': 'off',
    },
  },
  // Disable formatting rules (incl. eslint-plugin-vue's) that conflict with Prettier. Must be last.
  prettier,
]
