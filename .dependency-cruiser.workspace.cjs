// Orphan check for a single workspace, run with that workspace's own path
// aliases resolved to absolute paths. The repo-wide `.dependency-cruiser.cjs`
// cannot do this - dependency-cruiser takes one `tsConfig` for the whole
// cruise, and one workspace's alias mapping is wrong for every other workspace.
//
// `scripts/deps-graph-aliased.mjs` is the only intended caller: it generates a
// tsconfig with that workspace's aliases rebased and passes it as `--ts-config`.
// See `pnpm deps:graph` for the graph-wide rules.
const { createJiti } = require('jiti')

const jiti = createJiti(__filename)
const { createDepCruiserConfig } = jiti(
  '@busirocket/quality-config/dependency-cruiser',
)

module.exports = createDepCruiserConfig({ scope: 'workspace' })
