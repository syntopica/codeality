import { describe, expect, it } from 'vitest'

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createKnipConfig } from '../src/knip'

const emptyProject = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'qc-knip-'))
  writeFileSync(join(dir, 'package.json'), '{}')
  return dir
}

describe('createKnipConfig', () => {
  it('omits missing preset roots even when the caller names none', () => {
    const config = createKnipConfig({
      framework: 'ts-package',
      cwd: emptyProject(),
    })
    expect(config.entry).toEqual([])
    expect(config.project).not.toContain('src/**/*.ts!')
  })

  it('replaces a missing default entry with the caller entry', () => {
    const config = createKnipConfig({
      framework: 'ts-package',
      entry: ['src/cli/main.ts'],
      cwd: emptyProject(),
    })
    expect(config.entry).toEqual(['src/cli/main.ts'])
  })

  it('merges the caller entry with an existing default entry', () => {
    const dir = emptyProject()
    mkdirSync(join(dir, 'src'))
    writeFileSync(join(dir, 'src/index.ts'), '')
    const config = createKnipConfig({
      framework: 'ts-package',
      entry: ['src/cli/main.ts'],
      cwd: dir,
    })
    expect(config.entry).toEqual(['src/index.ts!', 'src/cli/main.ts'])
  })

  it('marks runtime entries and sources for production and leaves config unmarked', () => {
    const dir = emptyProject()
    mkdirSync(join(dir, 'src'))
    writeFileSync(join(dir, 'index.html'), '')
    writeFileSync(join(dir, 'vite.config.ts'), '')
    writeFileSync(join(dir, 'src/main.ts'), '')
    const config = createKnipConfig({
      framework: 'vite-vue',
      cwd: dir,
    })
    expect(config.entry).toEqual(['index.html!', 'vite.config.*'])
    expect(config.project).toContain('src/**/*.{ts,vue}!')
  })

  it('preserves explicit caller patterns even when their roots do not exist', () => {
    const config = createKnipConfig({
      framework: 'ts-package',
      cwd: emptyProject(),
      entry: ['missing/main.ts!'],
      project: ['missing/**/*.ts!'],
    })
    expect(config.entry).toContain('missing/main.ts!')
    expect(config.project).toContain('missing/**/*.ts!')
  })

  it('omits preset source patterns when src contains only documentation', () => {
    const dir = emptyProject()
    mkdirSync(join(dir, 'src'))
    writeFileSync(join(dir, 'src/README.md'), '# Skills')
    const config = createKnipConfig({ framework: 'ts-package', cwd: dir })
    expect(config.project).not.toContain('src/**/*.ts!')
  })

  it('does not exempt ESLint packages for a custom configuration', () => {
    const config = createKnipConfig({
      framework: 'ts-package',
      cwd: emptyProject(),
    })
    expect(config.ignoreDependencies).not.toContain('@eslint/js')
    expect(config.ignoreDependencies).not.toContain('typescript-eslint')
  })

  it('preserves compatibility exemptions for consumers of the shared ESLint config', () => {
    const dir = emptyProject()
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ devDependencies: { '@syntopica/eslint-config': '*' } }),
    )
    const config = createKnipConfig({ framework: 'ts-package', cwd: dir })
    expect(config.ignoreDependencies).toContain('@eslint/js')
    expect(config.ignoreDependencies).toContain('typescript-eslint')
  })

  it('excludes tests and stories from production only', () => {
    const config = createKnipConfig({
      framework: 'nestjs',
      cwd: emptyProject(),
    })
    const exclusions = (config.project as string[]).filter((pattern) =>
      pattern.startsWith('!'),
    )
    expect(exclusions.length).toBeGreaterThan(0)
    for (const pattern of exclusions) expect(pattern.endsWith('!')).toBe(true)
  })

  it('ignores the framework package in production mode only', () => {
    const config = createKnipConfig({ framework: 'astro', cwd: emptyProject() })
    expect(config.ignoreDependencies).toContain('astro!')
    expect(
      createKnipConfig({ framework: 'vite-vue', cwd: emptyProject() })
        .ignoreDependencies,
    ).not.toContain('vue!')
  })
})
