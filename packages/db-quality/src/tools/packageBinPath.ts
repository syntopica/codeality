import { fileURLToPath } from 'node:url'

// The package's own `node_modules/.bin`: one level up from both `dist/cli.js`
// and `src/tools/`. When a consumer installs the peers next to this package
// rather than in the project, or runs the bin from a checkout, this is where
// squawk, prisma-lint and eslint live.
export const packageBinPath = (): string =>
  fileURLToPath(new URL('../node_modules/.bin', import.meta.url))
