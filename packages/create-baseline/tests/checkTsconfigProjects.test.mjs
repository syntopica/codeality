import { describe, expect, it } from 'vitest'

import { checkTsconfigProjects } from '../bin/conformance/checkTsconfigProjects.mjs'

// The shape found in verticagtm: a solution root referencing three projects.
const SOLUTION = {
  root: { files: [], references: [{ path: './tsconfig.app.json' }] },
  solution: true,
  leaves: [
    { reference: 'tsconfig.app.json', config: 'tsconfig.app.json', parsed: {} },
    {
      reference: 'tsconfig.node.json',
      config: 'tsconfig.node.json',
      parsed: {},
    },
    {
      reference: 'tsconfig.next.json',
      config: 'tsconfig.next.json',
      parsed: {},
    },
  ],
}

describe('checkTsconfigProjects', () => {
  it('passes when type-check names every referenced project', () => {
    const scripts = {
      'type-check':
        'tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit && tsc -p tsconfig.next.json --noEmit',
    }
    expect(checkTsconfigProjects({ tsconfigs: SOLUTION, scripts })).toEqual([])
  })

  it('passes a bare `tsc -b`, which builds the whole solution', () => {
    const scripts = { 'type-check': 'tsc -b --force' }
    expect(checkTsconfigProjects({ tsconfigs: SOLUTION, scripts })).toEqual([])
  })

  it('passes `vue-tsc --build`', () => {
    const scripts = { 'type-check': 'vue-tsc --build' }
    expect(checkTsconfigProjects({ tsconfigs: SOLUTION, scripts })).toEqual([])
  })

  // The verticagtm defect: two of three projects named, the largest surface
  // in the repository reaching CI unchecked.
  it('reports each referenced project type-check never names', () => {
    const scripts = {
      'type-check':
        'tsc -p tsconfig.node.json --noEmit && tsc -p tsconfig.next.json --noEmit',
    }
    const findings = checkTsconfigProjects({ tsconfigs: SOLUTION, scripts })
    expect(findings.map((f) => f.id)).toEqual([
      'tsconfig-project:tsconfig.app.json',
    ])
    expect(findings[0].level).toBe('error')
  })

  // `tsc -b` with named projects builds only those, so the bare-build pass
  // must not swallow the diff.
  it('does not let a project-scoped `tsc -b` cover the unnamed references', () => {
    const scripts = { 'type-check': 'tsc -b tsconfig.app.json' }
    const ids = checkTsconfigProjects({ tsconfigs: SOLUTION, scripts }).map(
      (f) => f.id,
    )
    expect(ids).toEqual([
      'tsconfig-project:tsconfig.node.json',
      'tsconfig-project:tsconfig.next.json',
    ])
  })

  it('follows type-check into a runner file', () => {
    const scripts = { 'type-check': 'node scripts/type-check.mjs' }
    const runners = {
      'scripts/type-check.mjs':
        "run('tsc -p tsconfig.app.json') // tsconfig.node.json tsconfig.next.json",
    }
    expect(
      checkTsconfigProjects({ tsconfigs: SOLUTION, scripts, runners }),
    ).toEqual([])
  })

  it('ignores a single-project root', () => {
    const tsconfigs = {
      root: { extends: '@syntopica/tsconfig/nextjs.json' },
      solution: false,
      leaves: [],
    }
    expect(
      checkTsconfigProjects({ tsconfigs, scripts: { 'type-check': 'tsc' } }),
    ).toEqual([])
  })

  it('ignores a repository without a tsconfig', () => {
    expect(
      checkTsconfigProjects({
        tsconfigs: null,
        scripts: { 'type-check': 'tsc' },
      }),
    ).toEqual([])
  })

  // checkGateCoverage already reports the missing gate; repeating it here
  // would be the same finding twice.
  it('reports nothing when there is no type-check script', () => {
    expect(checkTsconfigProjects({ tsconfigs: SOLUTION, scripts: {} })).toEqual(
      [],
    )
  })
})
