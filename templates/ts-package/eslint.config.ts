import { createBaseConfig } from '@repo/eslint-config/base'
import { createCodeQualityConfig } from '@repo/eslint-config/code-quality'
import { createNodeConfig } from '@repo/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  ...createCodeQualityConfig(),
]
