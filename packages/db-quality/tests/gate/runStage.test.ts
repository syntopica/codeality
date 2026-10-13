import { describe, expect, it } from 'vitest'

import { runStage } from '@/gate/runStage.js'

const finding = {
  code: 'BDB001',
  severity: 'error' as const,
  path: 'a',
  line: 1,
  message: 'm',
  subject: '',
  fingerprint: 'x',
}

describe('runStage', () => {
  it.each([
    [() => [], 'passed'],
    [() => [finding], 'findings'],
    [() => 'not-applicable' as const, 'skipped-not-applicable'],
    [
      () => {
        throw new Error('squawk is not installed')
      },
      'failed-to-run',
    ],
  ])('classifies %s as %s', (run, status) => {
    const result = runStage({ name: 's', run })
    expect(result.status).toBe(status)
    expect(result.durationSeconds).toBeGreaterThanOrEqual(0)
  })
  it('carries the rendered findings or the error as detail', () => {
    expect(runStage({ name: 's', run: () => [finding] }).detail).toBe(
      'a:1: BDB001 m\n1 findings',
    )
    expect(
      runStage({
        name: 's',
        run: () => {
          throw new Error('boom')
        },
      }).detail,
    ).toBe('boom')
  })
  it('carries the skip reason as detail on a skipped outcome', () => {
    const result = runStage({
      name: 's',
      run: () => ({ skipped: 'no --db-url and no linked project' }),
    })
    expect(result.status).toBe('skipped-not-applicable')
    expect(result.detail).toBe('no --db-url and no linked project')
  })
  it('turns findings into diagnostics with the stage rerun, and nothing else into one', () => {
    const result = runStage({
      name: 'audit',
      run: () => [finding],
      rerun: () => 'codeality-db audit --linked --json',
    })
    expect(result.diagnostics).toEqual([
      {
        tool: 'codeality-db',
        rule: 'BDB001',
        severity: 'error',
        location: { path: 'a', line: 1 },
        message: 'm',
        fingerprint: 'x',
        rerun: 'codeality-db audit --linked --json',
      },
    ])
    expect(
      runStage({ name: 's', run: () => [finding] }).diagnostics[0]?.rerun,
    ).toBe('codeality-db gate --json')
    expect(
      runStage({ name: 's', run: () => ({ skipped: 'why' }) }).diagnostics,
    ).toEqual([])
  })
})
