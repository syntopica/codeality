import { createBaseConfig } from '@repo/eslint-config/base'
import { createNextjsConfig } from '@repo/eslint-config/nextjs'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
]
