import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Finding } from '@/model/Finding.js'

const bin = fileURLToPath(new URL('../bin/codeality-test.mjs', import.meta.url))
const fixture = fileURLToPath(new URL('fixtures/suite', import.meta.url))

const audit = (
  command: string,
  args: string[] = [],
): { status: number | null; rules: Finding[] } => {
  const run = spawnSync(
    'node',
    [bin, '--project', fixture, command, '--json', ...args],
    {
      encoding: 'utf8',
    },
  )
  return {
    status: run.status,
    rules: (JSON.parse(run.stdout) as { findings: Finding[] }).findings,
  }
}

// The real path: the inventory probe loads the fixture's own vitest config,
// and `measure` runs its vitest with the JSON reporter and the RSS sampler.
describe('codeality-test', () => {
  beforeAll(() => {
    copyFileSync(join(fixture, 'manifest.json'), join(fixture, 'package.json'))
    execFileSync('pnpm', ['build'], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      stdio: 'ignore',
    })
  }, 60_000)
  afterAll(() => {
    rmSync(join(fixture, 'package.json'), { force: true })
  })

  it('check finds the doubled include, the DOM-free file and the cold hook', () => {
    const { status, rules } = audit('check')
    expect(status).toBe(1)
    const byRule = Object.fromEntries(rules.map((f) => [f.rule, f.evidence]))
    // The root include reaches both projects, so both files run twice.
    expect(byRule['duplicate-file-run']).toEqual([
      expect.stringMatching(/src\/dom\.test\.mjs \(dom, node\)$/),
      expect.stringMatching(/src\/pure\.test\.mjs \(dom, node\)$/),
    ])
    expect(byRule['dom-environment-unused']).toEqual([
      expect.stringMatching(/src\/pure\.test\.mjs$/),
    ])
    expect(byRule['uncached-hook-lint']).toEqual([
      'check:ci: eslint without --cache',
      'check:ci: prettier without --cache',
    ])
  }, 60_000)

  it('measure runs the suite and confirms the candidate under node', () => {
    const { rules } = audit('measure', [
      '--node-candidates',
      '--',
      '--project',
      'node',
    ])
    const byRule = Object.fromEntries(rules.map((f) => [f.rule, f]))
    expect(byRule['suite-run']?.message).toMatch(/^vitest exited 0 after/)
    expect(byRule['slowest-files']?.evidence).toHaveLength(2)
    expect(byRule['memory-use']?.message).toMatch(/peaked at \d+ MB/)
    expect(byRule['dom-environment-unused']?.message).toBe(
      '1 of 1 candidate files pass under node and still run under a DOM environment',
    )
  }, 120_000)
})
