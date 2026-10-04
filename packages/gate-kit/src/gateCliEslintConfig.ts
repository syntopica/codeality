import { createBaseConfig } from '@syntopica/eslint-config/base'
import { createCodeQualityConfig } from '@syntopica/eslint-config/code-quality'
import { createNodeConfig } from '@syntopica/eslint-config/node'

/**
 * The ESLint config of a gate CLI package: base, node and code-quality, with
 * the two exemptions every gate needs. `ignores` adds to dist, coverage and
 * assets.
 */
export const gateCliEslintConfig = (
  tsconfigRootDir: string,
  ignores: string[] = [],
) => [
  ...createBaseConfig({ tsconfigRootDir }),
  ...createNodeConfig(),
  ...createCodeQualityConfig(),
  {
    // The argv entry point dispatches to the commands: several top-level
    // statements by nature, the same exemption codeality-py gives cli.py.
    files: ['src/cli.ts'],
    rules: {
      'code-policy/one-primary-unit': 'off',
    },
  },
  {
    // A gate reads (and some write) files under a project root the person
    // names on the command line, so every filesystem call takes a computed
    // path and the rule fires on all of them without a taint to report. The
    // tests build their paths from `mkdtemp` or fixtures for the same reason.
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  { ignores: ['dist/**', 'coverage/**', 'assets/**', ...ignores] },
]
