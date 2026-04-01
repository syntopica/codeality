import { createBaseConfig } from '@repo/eslint-config/base'
import { createCodeQualityConfig } from '@repo/eslint-config/code-quality'
import { createViteReactConfig } from '@repo/eslint-config/vite-react'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createViteReactConfig(),
  ...createCodeQualityConfig(),
  // Entry-point bootstrap files are allowed multiple top-level statements
  {
    files: ['src/main.tsx', 'src/main.ts'],
    rules: {
      'code-policy/atomic-file': 'off',
    },
  },
]
