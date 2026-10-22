import { describe, expect, it } from 'vitest'
import complete from './fixtures/auditCompleteReport.json'
import { runAuditFixture } from './runAuditFixture'

describe('audit response boundary', () => {
  it.each([0, 1])('rejects a JSON operational error with exit %s', (status) => {
    const run = runAuditFixture({
      report: { error: { code: 'ERR_PNPM_AUDIT_SYNTHETIC' } },
      status,
    })
    expect(run.status, run.stdout + run.stderr).toBe(2)
    expect(run.stderr).toContain('error or invalid report')
    expect(run.stdout).not.toContain('0 advisories')
  })

  it.each([
    ['empty object', {}],
    ['null report', null],
    ['array report', []],
    ['missing advisory map', { metadata: complete.metadata }],
    ['null advisory map', { ...complete, advisories: null }],
    ['array advisory map', { ...complete, advisories: [] }],
    ['missing metadata', { advisories: complete.advisories }],
    ['empty metadata', { ...complete, metadata: {} }],
    [
      'inconsistent counts',
      {
        ...complete,
        metadata: {
          ...complete.metadata,
          vulnerabilities: {
            ...complete.metadata.vulnerabilities,
            moderate: 0,
          },
        },
      },
    ],
    [
      'unknown count severity',
      {
        ...complete,
        metadata: {
          ...complete.metadata,
          vulnerabilities: { ...complete.metadata.vulnerabilities, severe: 1 },
        },
      },
    ],
    [
      'unknown severity',
      {
        ...complete,
        advisories: {
          100: { ...complete.advisories['100'], severity: 'unknown' },
        },
      },
    ],
    [
      'missing identity',
      {
        ...complete,
        advisories: { 100: { ...complete.advisories['100'], id: null } },
      },
    ],
    [
      'invalid patch metadata',
      {
        ...complete,
        advisories: {
          100: { ...complete.advisories['100'], patched_versions: 7 },
        },
      },
    ],
    [
      'invalid finding paths',
      {
        ...complete,
        advisories: {
          100: { ...complete.advisories['100'], findings: [{ paths: [7] }] },
        },
      },
    ],
  ])('fails closed for %s', (_label, report) => {
    const run = runAuditFixture({ report })
    expect(run.status, run.stdout + run.stderr).toBe(2)
    expect(run.stdout).not.toContain('baseline-audit:')
  })

  it.each(['not JSON', ''])('rejects malformed or empty JSON: %j', (stdout) => {
    const run = runAuditFixture({ stdout })
    expect(run.status).toBe(2)
    expect(run.stderr).toContain('did not return JSON')
  })

  it('rejects missing patched-version metadata separately from explicit null', () => {
    const advisory = { ...complete.advisories['100'] }
    Reflect.deleteProperty(advisory, 'patched_versions')
    const run = runAuditFixture({
      report: { ...complete, advisories: { 100: advisory } },
    })
    expect(run.status).toBe(2)
    expect(run.stderr).toContain('Invalid patched-version metadata')
  })

  it('rejects unexpected subprocess status even with a complete response', () => {
    const run = runAuditFixture({ report: complete, status: 2 })
    expect(run.status).toBe(2)
    expect(run.stderr).toContain('Could not complete pnpm audit')
  })
})
