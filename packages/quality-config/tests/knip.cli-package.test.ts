import { describe, expect, it } from 'vitest'

import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const KNIP_BIN = join(import.meta.dirname, '../node_modules/knip/bin/knip.js')
const FACTORY = join(import.meta.dirname, '../src/knip.ts')

// Declared by every project that uses the baseline ESLint config, which is
// what the preset's `ignoreDependencies` list is for.
const DEV_DEPENDENCIES = [
  '@eslint/js',
  'dependency-cruiser',
  'eslint-config-prettier',
  'eslint-plugin-promise',
  'eslint-plugin-security',
  'eslint-plugin-unused-imports',
  'jscpd',
  'lefthook',
  'type-coverage',
  'typescript-eslint',
]

// The binaries a package provides, which knip reads from its manifest to tell
// that a script naming `lefthook` or `depcruise` uses that package.
const PACKAGE_BINARIES: Record<string, Record<string, string>> = {
  'dependency-cruiser': { depcruise: 'bin/depcruise.js' },
  lefthook: { lefthook: 'bin/lefthook.js' },
}

// What an installed package leaves behind: a manifest, and a shim in
// node_modules/.bin for each binary.
const installDependencies = (dir: string): void => {
  const bin = join(dir, 'node_modules/.bin')
  mkdirSync(bin, { recursive: true })
  for (const name of DEV_DEPENDENCIES) {
    mkdirSync(join(dir, 'node_modules', name), { recursive: true })
    writeFileSync(
      join(dir, 'node_modules', name, 'package.json'),
      JSON.stringify({ name, version: '1.0.0', bin: PACKAGE_BINARIES[name] }),
    )
  }
  for (const shim of ['lefthook', 'depcruise']) {
    writeFileSync(join(bin, shim), '#!/bin/sh\n')
    chmodSync(join(bin, shim), 0o755)
  }
}

// A CLI-shaped package: the entry is not src/index.ts, and lefthook and
// dependency-cruiser are devDependencies that scripts name directly.
const cliPackage = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'qc-cli-'))
  mkdirSync(join(dir, 'src/cli'), { recursive: true })
  writeFileSync(join(dir, 'src/cli/main.ts'), 'console.log("hi")\n')
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      name: 'cli-package',
      type: 'module',
      scripts: {
        prepare: 'lefthook install',
        'deps:graph': 'depcruise src',
        dupes: 'baseline-dupes .',
        'type-coverage': 'baseline-type-coverage',
        'secrets:check': 'gitleaks detect',
      },
      devDependencies: Object.fromEntries(
        DEV_DEPENDENCIES.map((name) => [name, '*']),
      ),
    }),
  )
  writeFileSync(
    join(dir, 'knip.config.ts'),
    `import { createKnipConfig } from ${JSON.stringify(FACTORY)}
export default createKnipConfig({ framework: 'ts-package', entry: ['src/cli/main.ts'] })
`,
  )
  installDependencies(dir)
  return dir
}

describe('createKnipConfig on a CLI-shaped package', () => {
  it('leaves knip with no configuration hints', () => {
    const dir = cliPackage()
    const run = spawnSync(
      process.execPath,
      [KNIP_BIN, '--treat-config-hints-as-errors'],
      { cwd: dir, encoding: 'utf8' },
    )
    expect(run.stdout + run.stderr).not.toMatch(/Configuration hints/u)
    expect(run.stdout).not.toMatch(/Unused devDependencies/u)
    expect(run.status).toBe(0)
  })
})
