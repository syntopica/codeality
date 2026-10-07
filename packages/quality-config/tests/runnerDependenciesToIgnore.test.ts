import { describe, expect, it } from 'vitest'

import { mkdtempSync, writeFileSync } from 'node:fs'
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

  it('ignores everything when package.json is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qc-runner-'))
    expect(runnerDependenciesToIgnore(dir)).toHaveLength(4)
  })
})
