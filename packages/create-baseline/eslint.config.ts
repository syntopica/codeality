import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createNodeConfig } from '@busirocket/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  {
    // This package ships runnable `.mjs` rather than compiled TypeScript: it
    // is the first thing an adopter runs, often through `npx` before anything
    // is installed, so it cannot depend on a build step of its own. The typed
    // rules have no project to read for these files; everything that does not
    // need type information still applies.
    files: ['bin/**/*.mjs', 'tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
  },
  {
    // The two units that touch the filesystem are covered against a real
    // temporary directory rather than a mock, because what they assert about
    // is the shape of a real repository. Every path in these tests is built
    // from `mkdtemp`, so the rule fires on every line and has nothing to say:
    // there is no external input anywhere in the file to be tainted by.
    files: ['tests/**/*.mjs'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
]
