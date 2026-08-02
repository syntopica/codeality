// dependency-cruiser loads CommonJS config; the shared factory is TypeScript,
// so jiti (a direct root dependency for exactly this purpose) transpiles it
// on the fly. There is no root tsconfig.json, so the factory runs with its
// default (no tsConfig) options.
const { createJiti } = require('jiti')

const jiti = createJiti(__filename)
const { createDepCruiserConfig } = jiti(
  '@busirocket/quality-config/dependency-cruiser',
)

module.exports = createDepCruiserConfig()
