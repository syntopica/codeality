#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { cwd, exit } from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(__dirname, '..')

async function loadBaselineVersions() {
  const path = resolve(PACKAGE_ROOT, 'baseline-versions.json')
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw)
}

function parseArgs(argv) {
  const flags = { check: false, soft: false, hard: false }
  for (const a of argv) {
    if (a === '--check') flags.check = true
    if (a === '--soft') flags.soft = true
    if (a === '--hard') flags.hard = true
  }
  if (!flags.check && !flags.soft && !flags.hard) {
    flags.soft = true
  }
  return flags
}

async function readPackageJson(root) {
  const path = resolve(root, 'package.json')
  // `root` is the directory this CLI was invoked against (cwd, or the target
  // project it is checking) — reading its manifest is the tool's job, not
  // untrusted input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw)
}

function collectDeps(manifest) {
  const d = manifest.dependencies ?? {}
  const dev = manifest.devDependencies ?? {}
  return { ...d, ...dev }
}

function missingBaseline(deps, names) {
  return names.filter((name) => deps[name] == null)
}

// Presets are consumable only by a project that owns its compiler options. A
// framework that generates them (Nuxt writes `.nuxt/tsconfig.json`, which the
// project's own tsconfig then extends) leaves this package no insertion point,
// so requiring the dependency there would only add one nothing reads - which
// the knip gate correctly reports as dead weight.
const TSCONFIG_PACKAGE = '@busirocket/tsconfig'

// A tsconfig inside a dot-directory is build output its framework regenerates,
// never a file anyone authored and never one that could extend a shared preset.
const GENERATED_TSCONFIG_PATH = /(^|\/)\.[^/]+\//

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

  const printInstall = (required = names) => {
    const spec = required.map((p) => `${p}@${versions[p]}`).join(' ')
    console.log('pnpm (recommended):')
    console.log(`  pnpm add -D ${spec}`)
    console.log('npm:')
    console.log(`  npm install -D ${spec}`)
  }

  let manifest = null
  try {
    manifest = await readPackageJson(root)
  } catch {
    if (flags.soft) {
      console.log('@busirocket baseline — add these devDependencies:\n')
      printInstall()
      console.log(
        '\n(No package.json in current directory; skipped dependency scan.)',
      )
      return
    }
    console.error('create-baseline: no package.json in current directory.')
    exit(2)
  }

  const deps = collectDeps(manifest)
  const generatedTsConfig = await extendsGeneratedTsConfig(root)
  const required = generatedTsConfig
    ? names.filter((name) => name !== TSCONFIG_PACKAGE)
    : names
  const missing = missingBaseline(deps, required)
  const eslintOk = await hasEslintConfig(root)
  const missingQuality = await missingQualityConfigs(root)

  if (flags.soft) {
    console.log('@busirocket baseline — add these devDependencies:\n')
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
        '\nNo eslint.config.* found. Add a flat config that imports @busirocket/eslint-config (see https://github.com/BusiRocket/engineering-baseline/tree/main/docs/adoption).',
      )
    }
    if (missingQuality.length) {
      console.log(
        '\nMissing quality-gate config:',
        missingQuality.join(', '),
        '(see @busirocket/quality-config and docs/adoption/new-repo.md).',
      )
    }
  }

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
      printInstall(required)
      exit(1)
    }
    console.log('create-baseline: baseline packages and checks OK.')
  }
}

try {
  await main()
} catch (err) {
  console.error(err)
  exit(1)
}
