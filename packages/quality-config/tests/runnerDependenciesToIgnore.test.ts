import { describe, expect, it } from 'vitest'

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { runnerDependenciesToIgnore } from '../src/runnerDependenciesToIgnore'

const projectWith = (scripts: Record<string, string>): string => {
  const dir = mkdtempSync(join(tmpdir(), 'qc-runner-'))
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts }))
  return dir
}

describe('runnerDependenciesToIgnore', () => {
  it('ignores every runner dependency when only baseline-* runners are wired', () => {
    const dir = projectWith({
      prepare: 'baseline-hooks-install',
      'deps:graph': 'baseline-deps-graph',
    })
    expect(runnerDependenciesToIgnore(dir).sort()).toEqual([
      'dependency-cruiser',
      'jscpd',
      'lefthook',
      'type-coverage',
    ])
  })

  it('leaves out a dependency whose binary a script names directly', () => {
    const dir = projectWith({
      prepare: 'lefthook install',
      'deps:graph': 'pnpm exec depcruise src',
      dupes: 'baseline-dupes .',
    })
    expect(runnerDependenciesToIgnore(dir).sort()).toEqual([
      'jscpd',
      'type-coverage',
    ])
  })

  it('reads `pnpm <script>` as running the script, not the binary', () => {
    const dir = projectWith({
      'type-coverage': 'baseline-type-coverage',
      'check:quality': 'pnpm deps:graph && pnpm run type-coverage',
      'deps:graph': 'baseline-deps-graph',
    })
    expect(runnerDependenciesToIgnore(dir)).toContain('type-coverage')
  })

  it('still reads `pnpm exec <binary>` as the binary', () => {
    const dir = projectWith({ 'type-coverage': 'pnpm exec type-coverage' })
    expect(runnerDependenciesToIgnore(dir)).not.toContain('type-coverage')
  })

  it('leaves lefthook to knip when a Lefthook config file exists', () => {
    const dir = projectWith({ prepare: 'baseline-hooks-install' })
    writeFileSync(join(dir, 'lefthook.yml'), 'pre-commit: {}\n')
    expect(runnerDependenciesToIgnore(dir)).not.toContain('lefthook')
  })

  it('finds a Lefthook config under .config/', () => {
    const dir = projectWith({ prepare: 'baseline-hooks-install' })
    mkdirSync(join(dir, '.config'))
    writeFileSync(join(dir, '.config', 'lefthook.toml'), '')
    expect(runnerDependenciesToIgnore(dir)).not.toContain('lefthook')
  })

  it('ignores everything when package.json is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qc-runner-'))
    expect(runnerDependenciesToIgnore(dir)).toHaveLength(4)
  })
})
