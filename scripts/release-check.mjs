#!/usr/bin/env node
// A release is not done when the version is bumped. This checks that every
// publishable package's package.json "version" is actually released:
//   - a git tag `<unscoped-name>@<version>` exists, and is annotated
//   - that exact version exists on the npm registry
//   - CHANGELOG.md documents it (a `## <version>` heading)
//
// Deliberately NOT part of `check:ci`: it needs the network, and the commit
// that bumps a version legitimately precedes its tag and its publish. Run it
// after a release, or to audit what the repo claims to have shipped.
//
// Usage:
//   node scripts/release-check.mjs            check tags, npm and changelogs
//   node scripts/release-check.mjs --no-npm   skip the registry check (offline)

import { execFile } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { argv, exit } from 'node:process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const PACKAGES_DIR = resolve(REPO_ROOT, 'packages')

async function readPublishablePackages() {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true })
  const packages = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dir = resolve(PACKAGES_DIR, entry.name)
    let pkg
    try {
      // `entry.name` comes from a directory listing of this repo's own
      // packages/ folder, not untrusted input.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      pkg = JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8'))
    } catch {
      continue /* directory without a package.json; skip */
    }
    if (!pkg.name || !pkg.version || pkg.private) continue
    packages.push({ dir, name: pkg.name, version: pkg.version })
  }
  return packages.sort((a, b) => a.name.localeCompare(b.name))
}

// Tag convention in this repo: the unscoped package name, e.g.
// `@busirocket/quality-config@0.1.0` is tagged `quality-config@0.1.0`.
function tagFor({ name, version }) {
  return `${name.replace(/^@[^/]+\//, '')}@${version}`
}

async function readGitTags() {
  const { stdout } = await run('git', ['tag', '--list'], { cwd: REPO_ROOT })
  return new Set(stdout.split('\n').filter(Boolean))
}

// A release tag should carry its own message and tagger. `git cat-file -t`
// answers `tag` for an annotated one and `commit` for a lightweight one,
// which is just a moving branch-like pointer with no record of who cut it.
// This is a warning, not a failure: the three lightweight tags cut on
// 2026-08-04 are already pushed, and a release tag is immutable.
async function readLightweightTags(tags) {
  const lightweight = []
  for (const tag of tags) {
    const { stdout } = await run('git', ['cat-file', '-t', tag], {
      cwd: REPO_ROOT,
    })
    if (stdout.trim() !== 'tag') lightweight.push(tag)
  }
  return lightweight.sort()
}

async function readNpmVersions(name) {
  try {
    const { stdout } = await run('npm', ['view', name, 'versions', '--json'], {
      cwd: REPO_ROOT,
    })
    const parsed = JSON.parse(stdout)
    return { versions: new Set([parsed].flat()) }
  } catch (err) {
    const output = `${err.stdout ?? ''}${err.stderr ?? ''}`
    if (output.includes('E404')) return { versions: new Set() }
    return { error: output.trim().split('\n').at(-1) ?? String(err) }
  }
}

async function readChangelogVersions(dir) {
  let content
  try {
    // `dir` is a directory of this repo's own packages/ folder.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    content = await readFile(resolve(dir, 'CHANGELOG.md'), 'utf8')
  } catch {
    return null /* no CHANGELOG.md at all */
  }
  return new Set(
    content
      .split('\n')
      .filter((line) => line.startsWith('## '))
      .map((line) => line.slice(3).trim()),
  )
}

async function checkPackage(pkg, { tags, checkNpm }) {
  const problems = []

  const tag = tagFor(pkg)
  if (!tags.has(tag)) problems.push(`no git tag \`${tag}\``)

  if (checkNpm) {
    const { versions, error } = await readNpmVersions(pkg.name)
    if (error) problems.push(`npm lookup failed: ${error}`)
    else if (!versions.size) problems.push('not published on npm')
    else if (!versions.has(pkg.version))
      problems.push(
        `npm has no ${pkg.version} (latest published: ${[...versions].at(-1)})`,
      )
  }

  const changelogVersions = await readChangelogVersions(pkg.dir)
  if (changelogVersions === null) problems.push('no CHANGELOG.md')
  else if (!changelogVersions.has(pkg.version))
    problems.push(`CHANGELOG.md has no \`## ${pkg.version}\` entry`)

  return problems
}

async function main() {
  const checkNpm = !argv.includes('--no-npm')
  const [packages, tags] = await Promise.all([
    readPublishablePackages(),
    readGitTags(),
  ])

  let failed = false
  for (const pkg of packages) {
    const problems = await checkPackage(pkg, { tags, checkNpm })
    if (!problems.length) {
      console.log(`release-check: ok    ${pkg.name}@${pkg.version}`)
      continue
    }
    failed = true
    console.error(`release-check: FAIL  ${pkg.name}@${pkg.version}`)
    for (const problem of problems) console.error(`  - ${problem}`)
  }

  if (failed) {
    console.error(
      '\nEach failure means the repo claims a version it has not fully released.\n' +
        'Tag the release commit, publish it, or add the missing CHANGELOG entry.',
    )
    exit(1)
  }
  // Every tag in this repo is a release tag, and the point of the warning is
  // the next one, so this looks at the whole history rather than only the
  // versions currently declared in package.json.
  const lightweight = await readLightweightTags(tags)
  if (lightweight.length) {
    console.warn(
      `\nrelease-check: ${lightweight.length} release tag(s) are lightweight, ` +
        'not annotated - they carry no message and no tagger:\n' +
        lightweight.map((tag) => `  - ${tag}`).join('\n') +
        '\n\nThese are already pushed and a release tag is immutable, so they ' +
        'stay as they are.\nCut the next one with `git tag -a <tag> -m "<message>"` ' +
        'so the history stops mixing both kinds.',
    )
  }

  console.log(
    `release-check: ${packages.length} packages fully released${
      checkNpm ? '' : ' (npm check skipped)'
    }.`,
  )
}

try {
  await main()
} catch (err) {
  console.error(err)
  exit(1)
}
