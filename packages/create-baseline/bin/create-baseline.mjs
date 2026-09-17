#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { cwd, exit } from 'node:process'
import { fileURLToPath } from 'node:url'

import { applyFixes } from './conformance/applyFixes.mjs'
import { formatFindings } from './conformance/formatFindings.mjs'
import { runConformance } from './conformance/runConformance.mjs'
import { checkPeers } from './scaffold/checkPeers.mjs'
import { collectDeps } from './scaffold/collectDeps.mjs'
import { readManifest } from './scaffold/readManifest.mjs'
import { workspaceRoots } from './scaffold/workspaceRoots.mjs'
import { writeMissing } from './scaffold/writeMissing.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(__dirname, '..')

async function loadBaselineVersions() {
  const path = resolve(PACKAGE_ROOT, 'baseline-versions.json')
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw)
}

function parseArgs(argv) {
  const flags = {
    check: false,
    soft: false,
    hard: false,
    write: false,
    fix: false,
  }
  for (const a of argv) {
    if (a === '--check') flags.check = true
    if (a === '--soft') flags.soft = true
    if (a === '--hard') flags.hard = true
    if (a === '--write') flags.write = true
    if (a === '--fix') flags.fix = true
  }
  // --fix is --check that also repairs what it can, so it implies it. Without
  // this a bare `--fix` would fall through to the default and report nothing.
  if (flags.fix) flags.check = true
  if (!flags.check && !flags.soft && !flags.hard && !flags.write) {
    flags.soft = true
  }
  return flags
}

// In a monorepo the per-workspace packages - eslint-config, tsconfig,
// code-policy - are declared by each workspace, not by the root. Reading the
// root manifest alone reports every one of them missing and tells the adopter
// to install packages it already has, which is how intelifactu, a repo running
// the whole toolchain, was told it had none of it.
async function collectWorkspaceDeps(root) {
  const deps = {}
  for (const workspace of await workspaceRoots(root)) {
    try {
      Object.assign(deps, collectDeps(await readManifest(workspace)))
    } catch {
      /* a directory without a manifest is not a workspace */
    }
  }
  return deps
}

function missingBaseline(deps, names) {
  return names.filter((name) => deps[name] == null)
}

// Presets are consumable only by a project that owns its compiler options. A
// framework that generates them (Nuxt writes `.nuxt/tsconfig.json`, which the
// project's own tsconfig then extends) leaves this package no insertion point,
// so requiring the dependency there would only add one nothing reads - which
// the knip gate correctly reports as dead weight.
const TSCONFIG_PACKAGE = '@syntopica/tsconfig'

// A tsconfig inside a dot-directory is build output its framework regenerates,
// never a file anyone authored and never one that could extend a shared preset.
const GENERATED_TSCONFIG_PATH = /(?:^|\/)\.[^/]+\//

async function extendsGeneratedTsConfig(root) {
  let raw
  try {
    // `root` is the directory this CLI was invoked against — reading its
    // tsconfig is the tool's job, not untrusted input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    raw = await readFile(resolve(root, 'tsconfig.json'), 'utf8')
  } catch {
    return false
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    // JSONC (comments, trailing commas) is valid tsconfig input but not valid
    // JSON. Treat an unreadable config as authored rather than generated, so
    // an unparseable file never silently drops a requirement.
    return false
  }
  const field = parsed.extends
  const entries = Array.isArray(field) ? field : field == null ? [] : [field]
  return entries.some((entry) => GENERATED_TSCONFIG_PATH.test(entry))
}

async function hasEslintConfig(root) {
  const candidates = [
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    'eslint.config.ts',
  ]
  for (const f of candidates) {
    try {
      await access(resolve(root, f))
      return true
    } catch {
      /* next */
    }
  }
  return false
}

const QUALITY_CONFIG_FILES = [
  'knip.config.ts',
  'knip.config.js',
  'lefthook.yml',
  'renovate.json',
]

async function missingQualityConfigs(root) {
  const missing = []
  for (const name of QUALITY_CONFIG_FILES) {
    try {
      await access(resolve(root, name))
    } catch {
      missing.push(name)
    }
  }
  // knip.config.ts and knip.config.js are alternatives: only report the pair
  // as missing if neither exists.
  const hasKnipConfig =
    !missing.includes('knip.config.ts') || !missing.includes('knip.config.js')
  const report = missing.filter(
    (name) => name !== 'knip.config.ts' && name !== 'knip.config.js',
  )
  if (!hasKnipConfig) report.unshift('knip.config.ts or knip.config.js')
  return report
}

async function main() {
  const versions = await loadBaselineVersions()
  const names = Object.keys(versions)
  const flags = parseArgs(process.argv.slice(2))
  const root = cwd()

  // pnpm refuses to add to a workspace root without -w (ERR_PNPM_ADDING_TO_ROOT),
  // so a workspace repository must be handed a command that actually runs.
  const isWorkspaceRoot = await access(
    resolve(root, 'pnpm-workspace.yaml'),
  ).then(
    () => true,
    () => false,
  )

  const printInstall = (required = names) => {
    const spec = required.map((p) => `${p}@${versions[p]}`).join(' ')
    console.log('pnpm (recommended):')
    console.log(`  pnpm add${isWorkspaceRoot ? ' -w' : ''} -D ${spec}`)
    console.log('npm:')
    console.log(`  npm install -D ${spec}`)
  }

  let manifest = null
  try {
    manifest = await readManifest(root)
  } catch {
    if (flags.soft) {
      console.log('@syntopica baseline — add these devDependencies:\n')
      printInstall()
      console.log(
        '\n(No package.json in current directory; skipped dependency scan.)',
      )
      return
    }
    console.error('create-baseline: no package.json in current directory.')
    exit(2)
  }

  // Workspace manifests first, so the root's own entry wins on a version clash
  // and the report names the version the repo installs at its top level.
  const deps = {
    ...(await collectWorkspaceDeps(root)),
    ...collectDeps(manifest),
  }

  // The ESLint peers the project's own config reaches for. pnpm reports a
  // mismatch as one line on install; the consequence surfaces much later as a
  // crash from inside ESLint that names neither the baseline nor the peer.
  const reportPeers = async () => {
    const peers = await checkPeers(root)
    if (!peers) {
      // A monorepo installs the config per workspace, not at the root, so each
      // one carries its own peers and is checked on its own terms.
      let checked = false
      for (const workspace of await workspaceRoots(root)) {
        const workspacePeers = await checkPeers(workspace)
        if (!workspacePeers) continue
        checked = true
        printPeers(workspacePeers, relative(root, workspace))
      }
      if (checked) return
      // The config is not installed yet, so there is nothing to compare
      // against. Say so: silence here reads as "peers are fine", and the
      // consequence is an opaque ESLint crash on the first lint run.
      console.log(
        '\nESLint peers: not verified. @syntopica/eslint-config is not ' +
          'installed here yet -- run the install above, then re-run this ' +
          'command to check them.',
      )
      return
    }
    printPeers(peers)
  }

  // One report per config location: the root in a single-package repo, each
  // workspace in a monorepo. `where` labels which.
  function printPeers({ missing, mismatched }, where) {
    if (!missing.length && !mismatched.length) return
    const scope = where ? ` in ${where}` : ''
    console.log(`\nESLint peers this project's config needs${scope}:\n`)
    for (const { name, range } of missing) {
      console.log(`  missing   ${name} (${range})`)
    }
    for (const { name, range, version } of mismatched) {
      console.log(`  too old   ${name} ${version} (needs ${range})`)
    }
    const spec = [...missing, ...mismatched]
      .map(({ name, range }) => `${name}@${range.replace(/^>=/, '^')}`)
      .join(' ')
    console.log(`\n  pnpm add -D ${spec}${where ? ` --filter ${where}` : ''}`)
    console.log(
      '\n@syntopica/eslint-config ships TypeScript source rather than a ' +
        'build, so these resolve from your project. A missing or too-old one ' +
        'fails ESLint before any rule runs.',
    )
  }

  // --write scaffolds the wiring rather than describing it. Every adopting
  // repo was hand-writing the same four files and the same ten scripts; the
  // only thing that varied was the knip preset, which is read off the
  // dependencies. Nothing that already exists is touched.
  if (flags.write) {
    const { framework, written, shadowed, scripts, workflow } =
      await writeMissing(root, deps)
    console.log(`create-baseline: detected framework \`${framework}\`.`)
    if (written.length) console.log(`  wrote: ${written.join(', ')}`)
    if (scripts.length) console.log(`  added scripts: ${scripts.join(', ')}`)
    for (const [found, name] of shadowed) {
      console.log(
        `\n  ${found} already configures this tool, so ${name} was not ` +
          `written.\n  The tool loads ${found} and would ignore ${name} ` +
          'even if both existed. Port it to the shared factory and delete ' +
          `${found}.`,
      )
    }
    if (workflow.existing) {
      console.log(
        `\n  ${workflow.existing} already runs the baseline entrypoints, so ` +
          'no CI workflow was written.',
      )
    }
    if (workflow.partial) {
      console.log(
        `\n  ${workflow.partial.join(', ')} exist but none of them runs ` +
          '`pnpm run check:ci`, so the gates have no trigger. No workflow was ' +
          'written: adding a second pipeline beside a working one would run ' +
          'every build twice. Add the three check:* steps to the existing ' +
          'workflow instead.',
      )
    }
    if (!written.length && !scripts.length && !shadowed.length) {
      console.log('  nothing to write; the wiring is already in place.')
    }
    const missingDeps = missingBaseline(deps, names)
    if (missingDeps.length) {
      console.log('\nStill missing from package.json:\n')
      printInstall(missingDeps)
    }
    await reportPeers()
    console.log(
      '\nReview the generated files before committing: deps:graph scopes ' +
        'itself to `src`, and a project with e2e specs or hand-run scripts ' +
        'needs those declared as knip entry points.\n\n' +
        (framework === 'nextjs'
          ? 'If you also switch tsconfig.json to ' +
            '@syntopica/tsconfig/nextjs, it sets `jsx: preserve` the way ' +
            'Next documents - SWC does the transform at build time. Vitest ' +
            'does not go through SWC, so every .tsx test fails to parse ' +
            'until its config names the runtime itself: `oxc: { jsx: { ' +
            "runtime: 'automatic' } }` on Vite 8, which ignores the older " +
            '`esbuild` block entirely.\n\n'
          : '') +
        'If pnpm reports ERR_PNPM_IGNORED_BUILDS for lefthook, allow its ' +
        'install script - `lefthook: true` under `allowBuilds:` in ' +
        'pnpm-workspace.yaml - or the hooks never reach .git/hooks.',
    )
    return
  }

  const generatedTsConfig = await extendsGeneratedTsConfig(root)
  const required = generatedTsConfig
    ? names.filter((name) => name !== TSCONFIG_PACKAGE)
    : names
  const missing = missingBaseline(deps, required)
  const eslintOk = await hasEslintConfig(root)
  const missingQuality = await missingQualityConfigs(root)

  if (flags.soft) {
    console.log('@syntopica baseline — add these devDependencies:\n')
    printInstall(required)
    if (generatedTsConfig) {
      console.log(
        `\n(${TSCONFIG_PACKAGE} not required: this project's tsconfig extends a framework-generated config, which owns the compiler options.)`,
      )
    }
    if (missing.length) {
      console.log('\nMissing from package.json:', missing.join(', '))
    } else {
      console.log('\nAll baseline packages are already listed in package.json.')
    }
    if (!eslintOk) {
      console.log(
        '\nNo eslint.config.* found. Add a flat config that imports @syntopica/eslint-config (see https://github.com/syntopica/codeality/tree/main/docs/adoption).',
      )
    }
    if (missingQuality.length) {
      console.log(
        '\nMissing quality-gate config:',
        missingQuality.join(', '),
        '(see @syntopica/quality-config and docs/adoption/new-repo.md).',
      )
    }
  }

  await reportPeers()

  if (flags.check || flags.hard) {
    let failed = false
    if (missing.length) {
      console.error(
        'create-baseline --check: missing packages:',
        missing.join(', '),
      )
      failed = true
    }
    if (flags.hard && !eslintOk) {
      console.error(
        'create-baseline --hard: expected eslint.config.js|mjs|cjs|ts in project root.',
      )
      failed = true
    }
    if (flags.hard && missingQuality.length) {
      console.error(
        'create-baseline --hard: missing quality-gate config:',
        missingQuality.join(', '),
      )
      failed = true
    }
    if (failed) {
      // Only what is actually missing. Printing the full baseline reads as
      // "you have none of this" to a project that has all but one of it, and
      // pasting the line re-pins ten packages nobody asked to touch.
      printInstall(missing.length ? missing : required)
      exit(1)
    }

    // Presence was never the interesting question. This command reported
    // "checks OK" for a repository with no CI, a `lint` that ignored warnings
    // and a `check:ci` that skipped four gates, because all it ever asserted
    // was that four packages appeared in package.json. Everything below
    // asserts that the gates those packages provide are actually invoked.
    const report = await runConformance(root, versions, today())

    if (flags.fix) {
      const applied = await applyFixes(root, report.findings)
      if (applied.length) {
        console.log('create-baseline --fix applied:')
        for (const change of applied) console.log(`  ${change}`)
        console.log(
          '\nRe-run `create-baseline --check` to see what is left. Anything ' +
            'still reported needs a decision this tool does not have.',
        )
      } else {
        console.log('create-baseline --fix: nothing was mechanically fixable.')
      }
      // The report was computed before the edits, so it describes the state
      // that has just been changed. Exiting on it would fail a run that has
      // repaired everything it was asked to.
      return
    }

    const errors = report.findings.filter((f) => f.level === 'error')
    if (report.findings.length) {
      console.log(
        `\ncreate-baseline --check: ${errors.length} error(s), ` +
          `${report.findings.length - errors.length} warning(s).\n`,
      )
      console.log(formatFindings(report))
      console.log(
        '\nWaive a finding by id in baseline.exceptions.json, with a reason ' +
          'and optionally an `expires` date:\n' +
          '  { "gate:knip": { "reason": "...", "expires": "2026-12-31" } }',
      )
    }
    if (errors.length) exit(1)
    console.log('create-baseline: baseline packages and wiring OK.')
  }
}

// Injected rather than read inside the exception loader so the whole
// conformance suite stays a pure function of its inputs, which is what makes
// it testable without freezing a clock.
function today() {
  return new Date().toISOString().slice(0, 10)
}

try {
  await main()
} catch (err) {
  console.error(err)
  exit(1)
}
