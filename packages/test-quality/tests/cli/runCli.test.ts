import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'
import { vitestRun } from '@tests/commands/vitestRun.js'

const A = '/r/a.test.ts'
const LEFTHOOK = `pre-push:
  commands:
    verify:
      run: pnpm run check:ci && pnpm run test
`
const MANIFEST = JSON.stringify({
  scripts: { 'check:ci': 'eslint .', test: 'vitest run --coverage' },
})

describe('runCli', () => {
  it('answers --version and --help, and prints the usage on a bad command', async () => {
    const io = commandIoFor({}, [], [])
    expect(await runCli(['--version'], io)).toBe(0)
    expect(io.out[0]).toMatch(/^codeality-test \d+\.\d+\.\d+\n$/)
    expect(await runCli(['--help'], io)).toBe(0)
    expect(io.out[1]).toMatch(/check.*measure/s)
    expect(await runCli([], io)).toBe(2)
    expect(await runCli(['nope'], io)).toBe(2)
    expect(await runCli(['--project'], io)).toBe(2)
    expect(await runCli(['check', '--bogus'], io)).toBe(2)
    expect(io.err.join('')).toMatch(/usage: codeality-test/)
  })

  it('check reports the hook, the duplicate and the DOM-free file', async () => {
    const io = commandIoFor(
      {
        '/elsewhere/package.json': MANIFEST,
        '/elsewhere/lefthook.yml': LEFTHOOK,
        A: 'expect(1).toBe(1)',
      },
      [
        { file: A, project: 'dom', environment: 'jsdom' },
        { file: A, project: 'node', environment: 'node' },
      ],
      [],
    )
    expect(
      await runCli(['--project', '/elsewhere', 'check', '--json'], io),
    ).toBe(1)
    const { schemaVersion, findings, observations } = JSON.parse(
      io.out.join(''),
    ) as {
      schemaVersion: number
      findings: { rule: string; severity: string }[]
      observations: { name: string }[]
    }
    expect(schemaVersion).toBe(2)
    expect(findings.map((f) => [f.rule, f.severity])).toEqual([
      ['duplicate-file-run', 'error'],
      ['uncached-hook-lint', 'error'],
    ])
    expect(observations.map((o) => o.name)).toEqual([
      'dom-environment-candidates',
      'hook-runs-full-gate',
    ])
  })

  it('check passes a clean project', async () => {
    const io = commandIoFor(
      { '/repo/package.json': '{}' },
      [{ file: A, project: 'node', environment: 'node' }],
      [],
    )
    expect(await runCli(['check'], io)).toBe(0)
    expect(io.out.join('')).toBe('no findings\n')
  })

  it('measure reports cost, memory and the files that pass under node', async () => {
    const io = commandIoFor(
      {
        A: 'expect(1).toBe(1)',
        '/r/b.test.ts': 'expect(2).toBe(2)',
      },
      [
        { file: A, project: 'dom', environment: 'jsdom' },
        { file: '/r/b.test.ts', project: 'dom', environment: 'jsdom' },
      ],
      [
        vitestRun({
          stdout: 'Duration  10.00s (environment 70%, tests 5%)',
          report: {
            testResults: [
              {
                name: A,
                startTime: 0,
                endTime: 1500,
                status: 'passed',
              },
            ],
          },
          rssSamplesMb: [100, 300],
        }),
        vitestRun({
          report: {
            testResults: [
              {
                name: A,
                startTime: 0,
                endTime: 1,
                status: 'passed',
              },
              {
                name: '/r/b.test.ts',
                startTime: 0,
                endTime: 1,
                status: 'failed',
              },
            ],
          },
        }),
      ],
    )
    expect(
      await runCli(
        ['measure', '--node-candidates', '--top', '1', '--', '--bail=1'],
        io,
      ),
    ).toBe(1)
    expect(io.vitestArgs).toEqual([
      ['--bail=1'],
      ['--environment', 'node', A, '/r/b.test.ts'],
    ])
    const text = io.out.join('')
    expect(text).toContain('error environment-dominates')
    expect(text).toContain('suite-run: vitest exited 0')
    expect(text).toContain(`1.50 s ${A}`)
    expect(text).toContain('peaked at 300 MB, mean 200 MB')
    expect(text).toContain('1 of 2 candidate files pass under node')
  })

  it('measure with nothing to fix exits 0 and still prints its measurements', async () => {
    const io = commandIoFor({}, [], [vitestRun({ rssSamplesMb: [100] })])
    expect(await runCli(['measure'], io)).toBe(0)
    const text = io.out.join('')
    expect(text).toContain(
      'memory-use: vitest and its workers peaked at 100 MB',
    )
    expect(text).toMatch(/no findings\n$/)
  })

  it('check reports a hook that runs the whole gate without failing on it', async () => {
    const io = commandIoFor(
      {
        '/repo/package.json': JSON.stringify({
          scripts: {
            'check:ci': 'eslint . --cache',
            test: 'vitest run',
          },
        }),
        '/repo/lefthook.yml': LEFTHOOK,
      },
      [{ file: A, project: 'node', environment: 'node' }],
      [],
    )
    expect(await runCli(['check'], io)).toBe(0)
    expect(io.out.join('')).toMatch(
      /^hook-runs-full-gate: the pre-push hook runs[\s\S]*no findings\n$/,
    )
  })
})
