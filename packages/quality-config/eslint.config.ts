import { createBaseConfig } from '@syntopica/eslint-config/base'
import { createNodeConfig } from '@syntopica/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  {
    // Every path in these tests is built from `mkdtemp`, so the rule fires on
    // every line and has nothing to say: there is no external input anywhere
    // in the files to be tainted by.
    files: ['tests/**/*.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
]
