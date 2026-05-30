import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createCodeQualityConfig } from '@busirocket/eslint-config/code-quality'
import { createTailwindConfig } from '@busirocket/eslint-config/tailwind'
import { createViteVueConfig } from '@busirocket/eslint-config/vite-vue'
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
]
