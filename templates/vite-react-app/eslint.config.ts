import path from 'node:path'

import { createAccessibilityConfig } from '@busirocket/eslint-config/accessibility'
import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createCodeQualityConfig } from '@busirocket/eslint-config/code-quality'
import { createTailwindConfig } from '@busirocket/eslint-config/tailwind'
import { createViteReactConfig } from '@busirocket/eslint-config/vite-react'
import prettier from 'eslint-config-prettier'

// Layer order: base → framework → code-quality → accessibility → tailwind

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createViteReactConfig(),
  ...createCodeQualityConfig(),
  ...createAccessibilityConfig(),
  ...createTailwindConfig({ cssConfigPath: './src/styles.css' }),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    settings: {
      tailwindcss: {
        config: path.join(import.meta.dirname, 'src/styles.css'),
      },
    },
  },
  // Entry-point bootstrap files are allowed multiple top-level statements
  {
    files: ['src/main.tsx', 'src/main.ts'],
    rules: {
      'code-policy/atomic-file': 'off',
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
  // Disable formatting rules that conflict with Prettier. Must be last.
  prettier,
]
