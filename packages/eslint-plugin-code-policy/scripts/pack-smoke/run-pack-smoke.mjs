import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { installPackedTarball } from './install-packed-tarball.mjs'
import { presetFailures } from './preset-failures.mjs'

// Returns the exit code: 0 when every preset loads from the packed tarball,
// as ESM and as CJS, and reports.
export async function runPackSmoke(pkgDir) {
  const manifestPath = join(pkgDir, 'package.json')
  // `pkgDir` is this package's own directory.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const consumer = mkdtempSync(join(tmpdir(), 'code-policy-smoke-'))
  try {
    installPackedTarball(pkgDir, manifest, consumer)
    const requireThere = createRequire(join(consumer, 'package.json'))
    const failures = []
    for (const preset of [
      'recommended',
      'boundaries',
      'strict',
      'react',
      'next',
    ]) {
      failures.push(
        ...(await presetFailures(requireThere, manifest.name, preset)),
      )
    }
    if (failures.length > 0) {
      console.error(`pack-smoke failed:\n${failures.join('\n')}`)
      return 1
    }
    console.log(
      'pack-smoke: every preset loads from the tarball (ESM and CJS) and reports',
    )
    return 0
  } finally {
    rmSync(consumer, { recursive: true, force: true })
  }
}
