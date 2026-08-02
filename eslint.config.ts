import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createNodeConfig } from '@busirocket/eslint-config/node'

// Fallback config for plain Node scripts that have no closer eslint.config
// of their own: scripts/*.mjs (repo tooling) and the .mjs files shipped by
// packages/prettier-config and packages/create-baseline. Every package or
// template that already has its own eslint.config.ts resolves that one
// first (ESLint walks up from the linted file to the nearest config), so
// this file only ever applies where nothing closer exists.
export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
]
