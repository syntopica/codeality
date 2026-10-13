import { describe, expect, it } from 'vitest'

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const KNIP_BIN = join(import.meta.dirname, '../node_modules/knip/bin/knip.js')
const FACTORY = join(import.meta.dirname, '../src/knip.ts')

type Issues = {
  issues: {
    files: { name: string }[]
    dependencies: { name: string }[]
  }[]
}

// A package whose runtime imports one dependency, whose test imports another,
// and which carries a source file nothing imports.
const packageWithTestOnlyDependency = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'qc-knip-prod-'))
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(
    join(dir, 'src/index.ts'),
    "import { run } from 'runtime-dep'\nexport const main = (): void => run()\n",
  )
  writeFileSync(
    join(dir, 'src/index.test.ts'),
    "import { check } from 'test-only-dep'\nimport { main } from './index'\ncheck(main)\n",
  )
  writeFileSync(join(dir, 'src/dead.ts'), 'export const dead = 1\n')
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      name: 'prod-package',
      type: 'module',
      dependencies: { 'runtime-dep': '*', 'test-only-dep': '*' },
      devDependencies: { vitest: '*' },
    }),
  )
  for (const name of ['runtime-dep', 'test-only-dep', 'vitest']) {
    mkdirSync(join(dir, 'node_modules', name), { recursive: true })
    writeFileSync(
      join(dir, 'node_modules', name, 'package.json'),
      JSON.stringify({ name, version: '1.0.0' }),
    )
  }
  writeFileSync(
    join(dir, 'knip.config.ts'),
    `import { createKnipConfig } from ${JSON.stringify(FACTORY)}
export default createKnipConfig({ framework: 'ts-package', ignoreDependencies: ['@eslint/js', 'eslint-config-prettier', 'eslint-plugin-promise', 'eslint-plugin-security', 'eslint-plugin-unused-imports', 'typescript-eslint'] })
`,
  )
  return dir
}

const knip = (dir: string, extra: string[]): string => {
  const run = spawnSync(
    process.execPath,
    [KNIP_BIN, '--reporter', 'json', ...extra],
    { cwd: dir, encoding: 'utf8' },
  )
  return run.stdout
}

const findings = (dir: string, extra: string[]) => {
  const { issues } = JSON.parse(knip(dir, extra)) as Issues
  return {
    files: issues.flatMap((issue) => issue.files.map((file) => file.name)),
    dependencies: issues.flatMap((issue) =>
      issue.dependencies.map((dependency) => dependency.name),
    ),
  }
}

describe('createKnipConfig under knip --production', () => {
  it('starts from the runtime entry and leaves tests out', () => {
    const dir = packageWithTestOnlyDependency()
    const production = findings(dir, ['--production'])
    expect(production.files).toEqual(['src/dead.ts'])
    expect(production.dependencies).toEqual(['test-only-dep'])
  })

  it('still counts the test import as use in the default run', () => {
    const dir = packageWithTestOnlyDependency()
    const all = findings(dir, [])
    expect(all.files).toEqual(['src/dead.ts'])
    expect(all.dependencies).toEqual([])
  })
})
