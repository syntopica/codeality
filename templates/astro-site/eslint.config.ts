import { createAstroConfig } from '@repo/eslint-config/astro'
import { createBaseConfig } from '@repo/eslint-config/base'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createAstroConfig({ tsconfigRootDir: import.meta.dirname }),
]
