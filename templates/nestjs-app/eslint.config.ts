import { createBaseConfig } from '@syntopica/eslint-config/base'
import { createCodeQualityConfig } from '@syntopica/eslint-config/code-quality'
import { createNestjsConfig } from '@syntopica/eslint-config/nestjs'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNestjsConfig(),
  ...createCodeQualityConfig(),
]
