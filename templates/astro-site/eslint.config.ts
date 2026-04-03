import { createAstroConfig } from '@repo/eslint-config/astro'
import { createBaseConfig } from '@repo/eslint-config/base'
import { createCodeQualityConfig } from '@repo/eslint-config/code-quality'

// Layer order: base → framework (Astro + a11y + frontend boundaries) → code-quality

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createAstroConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
]
