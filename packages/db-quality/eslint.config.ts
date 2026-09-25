import { createBaseConfig } from '@syntopica/eslint-config/base'
import { createCodeQualityConfig } from '@syntopica/eslint-config/code-quality'
import { createNodeConfig } from '@syntopica/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  ...createCodeQualityConfig(),
  {
    // The argv entry point dispatches to the commands: several top-level
    // statements by nature, the same exemption codeality-py gives cli.py.
    files: ['src/cli.ts'],
    rules: {
      'code-policy/one-primary-unit': 'off',
      'code-policy/no-hidden-top-level-declarations': 'off',
    },
  },
  { ignores: ['dist/**', 'coverage/**', 'assets/**'] },
]
