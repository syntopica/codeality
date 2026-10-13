import { mkdirSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

// No network: each runtime dependency is linked from this workspace's install.
export function linkRuntimeDependencies(pkgDir, manifest, consumer) {
  const requireHere = createRequire(join(pkgDir, 'package.json'))
  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    const target = join(consumer, 'node_modules', dependency)
    // `consumer` is a fresh mkdtemp directory this script owns.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    mkdirSync(dirname(target), { recursive: true })
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- see above
    symlinkSync(
      dirname(requireHere.resolve(`${dependency}/package.json`)),
      target,
    )
  }
}
