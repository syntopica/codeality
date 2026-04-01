import { createAccessibilityConfig } from '@repo/eslint-config/accessibility'
import { createBaseConfig } from '@repo/eslint-config/base'
import { createCodeQualityConfig } from '@repo/eslint-config/code-quality'
import { createTailwindConfig } from '@repo/eslint-config/tailwind'
import { createViteReactConfig } from '@repo/eslint-config/vite-react'

// Layer order: base → framework → code-quality → accessibility → tailwind

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createViteReactConfig(),
  ...createCodeQualityConfig(),
  ...createAccessibilityConfig(),
  ...createTailwindConfig(),
  // Entry-point bootstrap files are allowed multiple top-level statements
  {
    files: ['src/main.tsx', 'src/main.ts'],
    rules: {
      'code-policy/atomic-file': 'off',
    },
  },
]
