import { createBaseConfig } from '@vibracomet/eslint-config/base'
import { createCodeQualityConfig } from '@vibracomet/eslint-config/code-quality'
import { createNodeConfig } from '@vibracomet/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  ...createCodeQualityConfig(),
]
