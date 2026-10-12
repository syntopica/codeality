import { createBaseConfig } from '@syntopica/eslint-config/base'
import { createDataFilesConfig } from '@syntopica/eslint-config/data-files'
import { createNodeConfig } from '@syntopica/eslint-config/node'

// Fallback config for plain Node scripts that have no closer eslint.config
// of their own: scripts/*.mjs (repo tooling) and the .mjs files shipped by
// packages/prettier-config and packages/create-baseline. Every package or
// template that already has its own eslint.config.ts resolves that one
// first (ESLint walks up from the linted file to the nearest config), so
// this file only ever applies where nothing closer exists.
export default [
  // The README's before/after fixture: `before/` fails on purpose, and both
  // are linted under the vite-react-app template's config, which is how
  // docs/examples/user-list/README.md reproduces the quoted output.
  { ignores: ['docs/examples/**'] },
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  ...createDataFilesConfig(),
]
