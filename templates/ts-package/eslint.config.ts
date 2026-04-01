import { createBaseConfig } from '@repo/eslint-config/base'
import { createNodeConfig } from '@repo/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
]
