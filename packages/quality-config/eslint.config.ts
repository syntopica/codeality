import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createNodeConfig } from '@busirocket/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
]
