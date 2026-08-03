// dependency-cruiser loads CommonJS config; the shared factory is TypeScript,
// so jiti (a direct root dependency for exactly this purpose) transpiles it
// on the fly. There is no root tsconfig.json, so the factory runs with its
// default (no tsConfig) options.
//
// The aliased workspaces are excluded from `no-orphans` here rather than inside
// the shared factory: those directory names belong to this repo, not to every
// project that consumes @busirocket/quality-config. `pnpm deps:graph:aliased`
// is what actually checks them, one cruise each with its own tsconfig.
const { createJiti } = require('jiti')

const jiti = createJiti(__filename)
const { createDepCruiserConfig } = jiti(
  '@busirocket/quality-config/dependency-cruiser',
)
const { ALIASED_WORKSPACES } = jiti('./scripts/aliasedWorkspaces.mjs')

module.exports = createDepCruiserConfig({
  orphanExemptions: ALIASED_WORKSPACES.map(({ workspace }) => `^${workspace}/`),
})
