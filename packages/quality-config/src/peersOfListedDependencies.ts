import { readListedDependencies } from './readListedDependencies'
import { readPeerDependencyNames } from './readPeerDependencyNames'

/**
 * Every package some dependency of `cwd` declares as a peer. knip counts a
 * peer of a used dependency as used itself (`eslint-plugin-astro` hosting
 * `typescript-eslint`), so ignoring one of these is a `Remove from
 * ignoreDependencies` hint the consumer cannot silence.
 */
export const peersOfListedDependencies = (cwd: string): Set<string> =>
  new Set(
    readListedDependencies(cwd).flatMap((name) =>
      readPeerDependencyNames(cwd, name),
    ),
  )
