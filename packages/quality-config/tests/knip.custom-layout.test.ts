import { describe, expect, it } from 'vitest'

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const customProject = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'qc-custom-knip-'))
  mkdirSync(join(dir, 'scripts'))
  writeFileSync(join(dir, 'scripts/main.ts'), 'console.log("live")\n')
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      name: 'custom-tooling',
      type: 'module',
      scripts: { 'secrets:check': 'gitleaks detect' },
      devDependencies: {
        jscpd: '*',
        'type-coverage': '*',
        'dependency-cruiser': '*',
        lefthook: '*',
      },
    }),
  )
  writeFileSync(
    join(dir, 'knip.config.ts'),
    `import { createKnipConfig } from ${JSON.stringify(join(import.meta.dirname, '../src/knip.ts'))}
export default createKnipConfig({ framework: 'ts-package', entry: ['scripts/main.ts!'], project: ['scripts/**/*.ts!'] })
`,
  )
  return dir
}

describe('custom tooling layout without the shared ESLint config', () => {
  it('has no inherited configuration hints without a src directory', () => {
    const run = spawnSync(
      process.execPath,
      [
        join(import.meta.dirname, '../node_modules/knip/bin/knip.js'),
        '--treat-config-hints-as-errors',
      ],
      { cwd: customProject(), encoding: 'utf8' },
    )
    expect(run.stdout + run.stderr).not.toMatch(/Configuration hints/u)
    expect(run.status).toBe(0)
  })

  it('still reports unused source, entry exports and ESLint dependencies', () => {
    const dir = customProject()
    writeFileSync(join(dir, 'scripts/dead.ts'), 'export const unused = true\n')
    writeFileSync(
      join(dir, 'scripts/main.ts'),
      'export const deadExport = true\n',
    )
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: 'custom-tooling',
        type: 'module',
        scripts: { 'secrets:check': 'gitleaks detect' },
        devDependencies: {
          '@eslint/js': '*',
          jscpd: '*',
          'type-coverage': '*',
          'dependency-cruiser': '*',
          lefthook: '*',
        },
      }),
    )
    const run = spawnSync(
      process.execPath,
      [
        join(import.meta.dirname, '../node_modules/knip/bin/knip.js'),
        '--treat-config-hints-as-errors',
      ],
      { cwd: dir, encoding: 'utf8' },
    )
    expect(run.stdout).toContain('scripts/dead.ts')
    expect(run.stdout).toContain('deadExport')
    expect(run.stdout).toContain('@eslint/js')
    expect(run.status).toBe(1)
  })
})
