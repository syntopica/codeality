import { describe, expect, it } from 'vitest'

import { expandScripts } from '../bin/conformance/expandScripts.mjs'

describe('expandScripts', () => {
  it('follows a reference from one script to another', () => {
    const scripts = {
      'check:ci': 'pnpm check:all && pnpm test',
      'check:all': 'pnpm type-check && pnpm lint',
      'type-check': 'tsc --noEmit',
      lint: 'eslint .',
      test: 'vitest run',
    }
    const { names } = expandScripts(scripts, ['check:ci'])
    expect([...names].sort()).toEqual([
      'check:all',
      'check:ci',
      'lint',
      'test',
      'type-check',
    ])
  })

  it('reads npm, yarn and bun invocations as references too', () => {
    const scripts = {
      a: 'npm run b && yarn c && bun run d',
      b: '',
      c: '',
      d: '',
    }
    const { names } = expandScripts(scripts, ['a'])
    expect([...names].sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  // A turbo task lives in the workspace manifests, not the root, so requiring
  // a root script by that name would report every monorepo as ungated.
  it('records a turbo task the root does not define', () => {
    const { names } = expandScripts(
      { 'check:ci': 'turbo run type-check lint test' },
      ['check:ci'],
    )
    expect(names.has('type-check')).toBe(true)
    expect(names.has('lint')).toBe(true)
    expect(names.has('test')).toBe(true)
  })

  it('returns the concatenated command text for tool-level matching', () => {
    const { text } = expandScripts({ 'check:ci': 'depcruise src' }, [
      'check:ci',
    ])
    expect(text).toContain('depcruise src')
  })

  it('terminates on a cycle', () => {
    const { names } = expandScripts({ a: 'pnpm b', b: 'pnpm a' }, ['a'])
    expect([...names].sort()).toEqual(['a', 'b'])
  })

  it('ignores entries the project does not define', () => {
    expect(expandScripts({}, ['check:ci']).names.size).toBe(0)
  })
})

describe('expandScripts runner files', () => {
  // The baseline repo's own check:quality is `node scripts/check-quality.mjs`,
  // a step runner that exists so a failure names the gate that produced it.
  // Without following it, the reference implementation reports its own gates
  // as uninvoked.
  it('follows a script into the runner file it delegates to', () => {
    const scripts = { 'check:quality': 'node scripts/check-quality.mjs' }
    const runners = {
      'scripts/check-quality.mjs':
        "const STEPS = ['knip']\nspawnSync('pnpm', ['run', 'knip'])",
    }
    const { text } = expandScripts(scripts, ['check:quality'], runners)
    expect(text).toContain('knip')
  })

  it('reads a runner named with a leading ./', () => {
    const scripts = { 'check:ci': './run.sh' }
    const { text } = expandScripts(scripts, ['check:ci'], {
      'run.sh': 'depcruise src',
    })
    expect(text).toContain('depcruise src')
  })

  it('reads each runner once even when several scripts name it', () => {
    const scripts = { a: 'node r.mjs', b: 'pnpm a && node r.mjs' }
    const { text } = expandScripts(scripts, ['b'], { 'r.mjs': 'knip' })
    expect(text.match(/knip/g)).toHaveLength(1)
  })

  it('ignores a runner path that was not read', () => {
    const scripts = { a: 'node missing.mjs' }
    expect(expandScripts(scripts, ['a'], {}).text).toBe('node missing.mjs')
  })
})
