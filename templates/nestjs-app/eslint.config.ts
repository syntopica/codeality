import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createCodeQualityConfig } from '@busirocket/eslint-config/code-quality'
import { createNestjsConfig } from '@busirocket/eslint-config/nestjs'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNestjsConfig(),
  ...createCodeQualityConfig(),
]
