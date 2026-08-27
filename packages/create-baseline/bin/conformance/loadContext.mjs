import { access, readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { collectDeps } from '../scaffold/collectDeps.mjs'
import { readManifest } from '../scaffold/readManifest.mjs'
import { workspaceRoots } from '../scaffold/workspaceRoots.mjs'

const TEST_CONFIGS = [
  'vitest.config.ts',
  'vitest.config.mts',
  'vitest.config.js',
  'vitest.config.mjs',
  'vite.config.ts',
  'vite.config.mts',
  'vite.config.js',
  'vite.config.mjs',
  'jest.config.ts',
  'jest.config.js',
  'jest.config.mjs',
  'jest.config.cjs',
]

/**
 * Everything the conformance checks read, gathered once.
 *
 * Each check is a pure function of this object, which is what makes the suite
 * cheap enough to run over the whole estate: one pass over a repository's
 * files, then ten checks against the result.
 */
export async function loadContext(root, versions) {
  const manifest = await readManifest(root)

  // Workspace manifests first so the root's own entry wins a version clash and
  // the report names the version the repo installs at its top level. Without
  // this, a monorepo that declares the baseline per workspace reads as having
  // none of it - which is how consumer-y, running the whole toolchain, was
  // told it had nothing installed.
  const deps = {}
  for (const workspace of await workspaceRoots(root)) {
    try {
      Object.assign(deps, collectDeps(await readManifest(workspace)))
    } catch {
      /* a directory without a manifest is not a workspace */
    }
  }
  Object.assign(deps, collectDeps(manifest))

  const scripts = manifest.scripts ?? {}

  return {
    root,
    manifest,
    scripts,
    deps,
    versions,
    runners: await readRunners(root, scripts),
    tsconfigs: await readTsconfigs(root),
    workflows: await readWorkflows(root),
    testConfig: await findTestConfig(root),
    hooks: { installed: await hooksInstalled(root) },
  }
}

// Git hooks belong to the repository, not to the directory the check runs in.
// A template or workspace nested inside a repo shares its hooks, so looking
// only at `<root>/.git` reports every one of them as unwired - eight
// templates, all of them covered by the hooks installed at the repo root.
async function hooksInstalled(root) {
  let dir = root
  for (;;) {
    if (await exists(resolve(dir, '.git'))) {
      return exists(resolve(dir, '.git/hooks/pre-commit'))
    }
    const parent = resolve(dir, '..')
    if (parent === dir) return false
    dir = parent
  }
}

// A local file a script hands its steps to, rather than chaining them inline.
// Only paths that appear in a script command are read, and only files that
// exist - this walks nothing and guesses nothing.
const RUNNER_PATH =
  /(?:\bnode\s+|\bbash\s+|\bsh\s+)([\w./-]+\.(?:mjs|cjs|js|ts|sh))\b/g

async function readRunners(root, scripts) {
  const runners = {}
  for (const command of Object.values(scripts)) {
    if (typeof command !== 'string') continue
    for (const match of command.matchAll(RUNNER_PATH)) {
      const path = match[1].replace(/^\.\//, '')
      // A path that climbs out of the project is not this project's runner.
      if (path.startsWith('../') || Object.hasOwn(runners, path)) continue
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        runners[path] = await readFile(resolve(root, path), 'utf8')
      } catch {
        /* named but not present: nothing to follow */
      }
    }
  }
  return runners
}

// tsconfig permits comments and trailing commas; strip both before parsing.
// A file this cannot parse contributes `null`, never a guess.
async function parseTsconfig(path) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const raw = (await readFile(path, 'utf8'))
      .replaceAll(/\/\*[\s\S]*?\*\//g, '')
      .replaceAll(/(^|[^:])\/\/.*$/gm, '$1')
      .replaceAll(/,(\s*[}\]])/g, '$1')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// The root tsconfig and, when it is solution-style, the projects it
// references. Each leaf carries the reference as the root spells it (what a
// `type-check` script would name) and the config file it resolves to - `tsc`
// accepts either a directory holding a tsconfig.json or the file itself.
async function readTsconfigs(root) {
  const parsed = await parseTsconfig(resolve(root, 'tsconfig.json'))
  if (!parsed) return null

  const solution =
    Array.isArray(parsed.files) &&
    parsed.files.length === 0 &&
    parsed.include === undefined &&
    Array.isArray(parsed.references)

  const leaves = []
  if (solution) {
    for (const entry of parsed.references) {
      if (typeof entry?.path !== 'string') continue
      const reference = entry.path.replace(/^\.\//, '')
      const viaDirectory = await exists(
        resolve(root, reference, 'tsconfig.json'),
      )
      const config = viaDirectory ? `${reference}/tsconfig.json` : reference
      leaves.push({
        reference,
        config,
        parsed: await parseTsconfig(resolve(root, config)),
      })
    }
  }

  return { root: parsed, solution, leaves }
}

async function readWorkflows(root) {
  const dir = resolve(root, '.github/workflows')
  let names
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    names = (await readdir(dir)).filter((name) => /\.ya?ml$/.test(name))
  } catch {
    return []
  }
  const workflows = []
  for (const name of names) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      workflows.push({ name, text: await readFile(resolve(dir, name), 'utf8') })
    } catch {
      /* unreadable file is not a workflow */
    }
  }
  return workflows
}

async function findTestConfig(root) {
  for (const name of TEST_CONFIGS) {
    const path = resolve(root, name)
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return { name, path, text: await readFile(path, 'utf8') }
    } catch {
      /* next candidate */
    }
  }
  return null
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
