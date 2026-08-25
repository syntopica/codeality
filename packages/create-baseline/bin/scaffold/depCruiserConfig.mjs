// dependency-cruiser loads CommonJS config only while the shared factory is
// TypeScript, so the generated file reaches it through jiti. Written for every
// adopter because the shape is the tool's, not the author's: seven repos
// adopting the gates by hand wrote this same file, differing only in which
// directories to exempt from `no-orphans`.
export function depCruiserConfig() {
  return `// dependency-cruiser loads CommonJS config; the shared factory is TypeScript,
// so jiti (a direct devDependency for exactly this purpose) transpiles it on
// the fly.
//
// \`tsConfigPath\` is what makes path aliases resolve: without it every aliased
// import comes back unresolved and the graph is mostly empty.
const { createJiti } = require('jiti')

const jiti = createJiti(__filename)
const { createDepCruiserConfig } = jiti(
  '@busirocket/quality-config/dependency-cruiser',
)

module.exports = createDepCruiserConfig({
  tsConfigPath: './tsconfig.json',
  orphanExemptions: [
    // Test runners collect these by glob; no module imports a test file.
    '\\\\.test\\\\.(ts|tsx)$',
    // Hand-run maintenance scripts, invoked by path from the shell.
    '(^|/)scripts/',
  ],
})
`
}
