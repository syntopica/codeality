#!/usr/bin/env node
// Single source of truth = each workspace package's package.json "version".
// Regenerates the derived files that otherwise drift silently:
//   - packages/eslint-plugin-code-policy/src/version.ts  (PLUGIN_VERSION, reported as the plugin's meta.version)
//   - packages/create-baseline/baseline-versions.json    (the pins create-baseline injects into consumers)
//
// Usage:
//   node scripts/sync-versions.mjs          write the derived files
//   node scripts/sync-versions.mjs --check  fail (exit 1) if any derived file is stale; used in CI

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { argv, exit } from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const PACKAGES_DIR = resolve(REPO_ROOT, 'packages')

// Packages whose published version create-baseline pins for the projects it sets up.
const BASELINE_CONSUMER_PACKAGES = [
  '@busirocket/eslint-config',
  '@busirocket/prettier-config',
  '@busirocket/tsconfig',
  '@busirocket/quality-config',
  'eslint-plugin-code-policy',
]

// Third-party tools the baseline mandates in consumer repos. Not derived from
// packages/* - bump deliberately, in lockstep with the version used by the
// templates.
const THIRD_PARTY_PINS = {
  // `create-baseline --write` generates a `.dependency-cruiser.cjs` that
  // reaches the shared TypeScript factory through jiti, and a `type-coverage`
  // script behind `baseline-type-coverage`. Both tools have to be installable
  // from the same line that installs the config, or the generated wiring
  // fails on first run.
  'dependency-cruiser': '^18.1.1',
  jiti: '^2.7.0',
  jscpd: '^5.0.14',
  knip: '^6.31.0',
  lefthook: '^2.1.10',
  'type-coverage': '^2.30.1',
}

async function readWorkspaceVersions() {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true })
  const versions = {}
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const manifestPath = resolve(PACKAGES_DIR, entry.name, 'package.json')
    try {
      // `entry.name` comes from a directory listing of this repo's own
      // packages/ folder, not untrusted input.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const pkg = JSON.parse(await readFile(manifestPath, 'utf8'))
      if (pkg.name && pkg.version) versions[pkg.name] = pkg.version
    } catch {
      /* directory without a package.json; skip */
    }
  }
  return versions
}

function renderPluginVersion(versions) {
  const version = versions['eslint-plugin-code-policy']
  if (!version)
    throw new Error(
      'sync-versions: eslint-plugin-code-policy version not found',
    )
  return `export const PLUGIN_VERSION = '${version}' as const\n`
}

function renderBaselineVersions(versions) {
  const pins = {}
  for (const name of BASELINE_CONSUMER_PACKAGES) {
    const version = versions[name]
    if (!version)
      throw new Error(`sync-versions: ${name} version not found in packages/*`)
    pins[name] = `^${version}`
  }
  Object.assign(pins, THIRD_PARTY_PINS)
  return `${JSON.stringify(pins, null, 2)}\n`
}

function buildTargets(versions) {
  return [
    {
      path: resolve(PACKAGES_DIR, 'eslint-plugin-code-policy/src/version.ts'),
      content: renderPluginVersion(versions),
    },
    {
      path: resolve(PACKAGES_DIR, 'create-baseline/baseline-versions.json'),
      content: renderBaselineVersions(versions),
    },
  ]
}

async function main() {
  const check = argv.includes('--check')
  const versions = await readWorkspaceVersions()
  const targets = buildTargets(versions)

  let drift = false
  for (const { path, content } of targets) {
    let current = null
    try {
      // `path` is one of the fixed, hardcoded targets built by
      // buildTargets() above, not untrusted input.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      current = await readFile(path, 'utf8')
    } catch {
      /* file does not exist yet */
    }
    if (current === content) continue

    const rel = path.slice(REPO_ROOT.length + 1)
    if (check) {
      drift = true
      console.error(`sync-versions: out of sync -> ${rel}`)
    } else {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- see above
      await writeFile(path, content)
      console.log(`sync-versions: wrote ${rel}`)
    }
  }

  if (check && drift) {
    console.error('\nRun `pnpm sync-versions` and commit the result.')
    exit(1)
  }
  console.log(
    check
      ? 'sync-versions: derived files are in sync.'
      : 'sync-versions: done.',
  )
}

try {
  await main()
} catch (err) {
  console.error(err)
  exit(1)
}
