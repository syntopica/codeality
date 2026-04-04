import path from 'node:path'

import { createAccessibilityConfig } from '@vibracomet/eslint-config/accessibility'
import { createBaseConfig } from '@vibracomet/eslint-config/base'
import { createCodeQualityConfig } from '@vibracomet/eslint-config/code-quality'
import { createTailwindConfig } from '@vibracomet/eslint-config/tailwind'
import { createViteReactConfig } from '@vibracomet/eslint-config/vite-react'

// Layer order: base → framework → code-quality → accessibility → tailwind

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createViteReactConfig(),
  ...createCodeQualityConfig(),
  ...createAccessibilityConfig(),
  ...createTailwindConfig(),
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
]
