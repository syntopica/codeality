import { describe, expect, it } from 'vitest'

import { checkTsconfigPresets } from '../bin/conformance/checkTsconfigPresets.mjs'

const DEPS = { '@busirocket/tsconfig': '^0.5.0' }

const solution = (leaves) => ({
  root: { files: [], references: leaves.map((l) => ({ path: l.config })) },
  solution: true,
  leaves,
})

describe('checkTsconfigPresets', () => {
  it('passes a single-project root that extends a preset', () => {
    const tsconfigs = {
      root: { extends: '@busirocket/tsconfig/nextjs.json' },
      solution: false,
      leaves: [],
    }
    expect(checkTsconfigPresets({ tsconfigs, deps: DEPS })).toEqual([])
  })

  it('reports a single-project root that does not extend a preset', () => {
    const tsconfigs = {
      root: { compilerOptions: { strict: true } },
      solution: false,
      leaves: [],
    }
    const findings = checkTsconfigPresets({ tsconfigs, deps: DEPS })
    expect(findings.map((f) => f.id)).toEqual(['tsconfig-preset:tsconfig.json'])
    expect(findings[0].level).toBe('error')
  })

  it('passes a solution whose leaves all extend presets', () => {
    const tsconfigs = solution([
      {
        reference: 'tsconfig.app.json',
        config: 'tsconfig.app.json',
        parsed: { extends: '@busirocket/tsconfig/vite-react.json' },
      },
      {
        reference: 'tsconfig.node.json',
        config: 'tsconfig.node.json',
        parsed: { extends: '@busirocket/tsconfig/node.json' },
      },
    ])
    expect(checkTsconfigPresets({ tsconfigs, deps: DEPS })).toEqual([])
  })

  // The consumer-g shape: one leaf on the preset, two hand-written and weaker
  // than base.json, nothing reporting it.
  it('reports each leaf that does not extend a preset', () => {
    const tsconfigs = solution([
      {
        reference: 'tsconfig.app.json',
        config: 'tsconfig.app.json',
        parsed: { extends: '@busirocket/tsconfig/vite-react.json' },
      },
      {
        reference: 'tsconfig.node.json',
        config: 'tsconfig.node.json',
        parsed: { compilerOptions: { strict: true } },
      },
    ])
    const ids = checkTsconfigPresets({ tsconfigs, deps: DEPS }).map((f) => f.id)
    expect(ids).toEqual(['tsconfig-preset:tsconfig.node.json'])
  })

  // The solution root itself must NOT extend a preset - the presets go on the
  // leaves - so its own lack of `extends` is not a finding.
  it('does not judge the solution root', () => {
    const tsconfigs = solution([
      {
        reference: 'tsconfig.app.json',
        config: 'tsconfig.app.json',
        parsed: { extends: '@busirocket/tsconfig/vite-react.json' },
      },
    ])
    expect(checkTsconfigPresets({ tsconfigs, deps: DEPS })).toEqual([])
  })

  it('accepts the array form of `extends`', () => {
    const tsconfigs = {
      root: { extends: ['@busirocket/tsconfig/base.json', './paths.json'] },
      solution: false,
      leaves: [],
    }
    expect(checkTsconfigPresets({ tsconfigs, deps: DEPS })).toEqual([])
  })

  it('skips a leaf that failed to parse', () => {
    const tsconfigs = solution([
      {
        reference: 'tsconfig.app.json',
        config: 'tsconfig.app.json',
        parsed: null,
      },
    ])
    expect(checkTsconfigPresets({ tsconfigs, deps: DEPS })).toEqual([])
  })

  it('ignores a repository that does not depend on @busirocket/tsconfig', () => {
    const tsconfigs = {
      root: { compilerOptions: {} },
      solution: false,
      leaves: [],
    }
    expect(checkTsconfigPresets({ tsconfigs, deps: {} })).toEqual([])
  })

  it('ignores a repository without a tsconfig', () => {
    expect(checkTsconfigPresets({ tsconfigs: null, deps: DEPS })).toEqual([])
  })
})
