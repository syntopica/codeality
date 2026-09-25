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
  {
    // The tool's whole job is to read files under a project root the person
    // names on the command line, so every filesystem call takes a computed
    // path and the rule fires on all of them without a taint to report. The
    // tests build their paths from `mkdtemp` for the same reason.
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  { ignores: ['dist/**', 'coverage/**', 'assets/**'] },
]
