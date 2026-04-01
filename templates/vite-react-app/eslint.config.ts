import { createBaseConfig } from '@repo/eslint-config/base'
import { createViteReactConfig } from '@repo/eslint-config/vite-react'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createViteReactConfig(),
]
