import { createBaseConfig } from '@repo/eslint-config/base'
import { createAstroConfig } from '@repo/eslint-config/astro'
import { createCodeQualityConfig } from '@repo/eslint-config/code-quality'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createAstroConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
]
