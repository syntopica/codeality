import { describe, expect, it } from 'vitest'

import { runStage } from '@/gate/runStage.js'

const finding = {
  code: 'BDB001',
  severity: 'warn' as const,
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
})
