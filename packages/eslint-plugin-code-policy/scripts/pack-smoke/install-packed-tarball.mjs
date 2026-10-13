import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { linkRuntimeDependencies } from './link-runtime-dependencies.mjs'

// Packs `pkgDir` and extracts the tarball as `consumer`'s installed copy, so
// what is linted is exactly what `files` and `exports` publish.
export function installPackedTarball(pkgDir, manifest, consumer) {
  const packed = execFileSync(
    'pnpm',
    ['pack', '--pack-destination', consumer, '--json'],
    { cwd: pkgDir, encoding: 'utf8' },
  )
  const installed = join(consumer, 'node_modules', manifest.name)
  // `consumer` is a fresh mkdtemp directory this script owns.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  mkdirSync(installed, { recursive: true })
  execFileSync('tar', [
    '-xzf',
    JSON.parse(packed).filename,
    '-C',
    installed,
    '--strip-components',
    '1',
  ])
  linkRuntimeDependencies(pkgDir, manifest, consumer)
}
