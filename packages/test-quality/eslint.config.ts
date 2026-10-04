import { createBaseConfig } from '@syntopica/eslint-config/base'
import { createCodeQualityConfig } from '@syntopica/eslint-config/code-quality'
import { createNodeConfig } from '@syntopica/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  ...createCodeQualityConfig(),
  {
    // The argv entry point dispatches to the commands: several top-level
    // statements by nature, the same exemption db-quality gives its cli.ts.
    files: ['src/cli.ts'],
    rules: {
      'code-policy/one-primary-unit': 'off',
    },
  },
  {
    // The tool reads files under a project root the person names on the
    // command line, so every filesystem call takes a computed path.
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  { ignores: ['dist/**', 'coverage/**', 'assets/**', 'tests/fixtures/**'] },
]
