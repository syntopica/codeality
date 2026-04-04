#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd, exit } from 'node:process'

const PACKAGES = [
  '@vibracomet/eslint-config',
  '@vibracomet/prettier-config',
  '@vibracomet/tsconfig',
]

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
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw)
}

function collectDeps(manifest) {
  const d = manifest.dependencies ?? {}
  const dev = manifest.devDependencies ?? {}
  return { ...d, ...dev }
}

function missingBaseline(deps) {
  return PACKAGES.filter((name) => deps[name] == null)
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

async function main() {
  const flags = parseArgs(process.argv.slice(2))
  const root = cwd()

  const printInstall = () => {
    const spec = PACKAGES.map((p) => `${p}@^0.1.0`).join(' ')
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
      console.log('@vibracomet baseline — add these devDependencies:\n')
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
  const missing = missingBaseline(deps)
  const eslintOk = await hasEslintConfig(root)

  if (flags.soft) {
    console.log('@vibracomet baseline — add these devDependencies:\n')
    printInstall()
    if (missing.length) {
      console.log('\nMissing from package.json:', missing.join(', '))
    } else {
      console.log('\nAll three packages are already listed in package.json.')
    }
    if (!eslintOk) {
      console.log(
        '\nNo eslint.config.* found. Add a flat config that imports @vibracomet/eslint-config (see docs/adoption).',
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
    if (failed) {
      printInstall()
      exit(1)
    }
    console.log('create-baseline: baseline packages and checks OK.')
  }
}

main().catch((err) => {
  console.error(err)
  exit(1)
})
