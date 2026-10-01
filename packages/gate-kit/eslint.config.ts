import { createBaseConfig } from '@syntopica/eslint-config/base'
import { createCodeQualityConfig } from '@syntopica/eslint-config/code-quality'
import { createNodeConfig } from '@syntopica/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  ...createCodeQualityConfig(),
  {
    // The baseline lives under a project root the person names.
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: { 'security/detect-non-literal-fs-filename': 'off' },
  },
  { ignores: ['coverage/**'] },
]
