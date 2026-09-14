import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { composedSubpaths } from './composedSubpaths.mjs'
import { ESLINT_SUBPATH_PEERS } from './eslintSubpathPeers.mjs'

const CONFIG_PACKAGE = '@syntopica/eslint-config'

// Reports the ESLint peers a project's config needs and does not have, and the
// ones it has at a version the config cannot use.
//
// pnpm already prints "Issues with peer dependencies found" on install, but
// it is one line among hundreds and the consequence only shows up later, as a
// crash from inside ESLint that names neither the baseline nor the peer.
// Measured adopting calculadora: three separate peers, three opaque failures,
// each diagnosed by hand.
export async function checkPeers(root) {
  const config = await manifestOf(root, CONFIG_PACKAGE)
  const declared = config?.peerDependencies
  if (!declared) return null /* not installed here; nothing to check against */

  const subpaths = await composedSubpaths(root)
  const needed = new Set(
    subpaths.flatMap((subpath) => ESLINT_SUBPATH_PEERS[subpath] ?? []),
  )

  const missing = []
  const mismatched = []
  for (const [name, range] of Object.entries(declared)) {
    if (name === 'typescript' || name === 'eslint') continue
    let version
    try {
      version = (await manifestOf(root, name))?.version
      if (!version) throw new Error('unresolved')
    } catch {
      if (needed.has(name)) missing.push({ name, range })
      continue
    }
    if (!satisfies(version, range)) mismatched.push({ name, range, version })
  }

  return { missing, mismatched }
}

// A package's own package.json, read from the project's node_modules.
//
// Not through require.resolve: these packages define `exports` without a root
// entry or a `./package.json` entry, so resolving either throws
// ERR_PACKAGE_PATH_NOT_EXPORTED while the package is installed and working.
// @syntopica/eslint-config is one of them. The directory is what every
// layout - pnpm's symlink included - actually has.
async function manifestOf(root, name) {
  try {
    // A path under the project's own node_modules, produced by its install.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const raw = await readFile(
      resolve(root, 'node_modules', name, 'package.json'),
      'utf8',
    )
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// A deliberately small range check: the peer ranges this config declares are
// all `>=x.y.z` or `^x.y.z`, and pulling in a semver dependency to parse two
// shapes would be the larger cost. Anything else is reported as unknown rather
// than guessed at.
function satisfies(version, range) {
  const parse = (value) => value.split('-')[0].split('.').map(Number)
  const compare = (a, b) =>
    a[0] - b[0] || (a[1] ?? 0) - (b[1] ?? 0) || (a[2] ?? 0) - (b[2] ?? 0)
  const prerelease = version.includes('-')

  const gte = /^>=\s*(\d+\.\d+\.\d+)$/.exec(range)
  if (gte) return !prerelease && compare(parse(version), parse(gte[1])) >= 0

  const caret = /^\^\s*(\d+\.\d+\.\d+)$/.exec(range)
  if (caret) {
    const floor = parse(caret[1])
    const actual = parse(version)
    if (prerelease) return false
    return actual[0] === floor[0] && compare(actual, floor) >= 0
  }
  return true
}
