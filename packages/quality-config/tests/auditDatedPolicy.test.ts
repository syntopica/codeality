import { describe, expect, it } from 'vitest'
import complete from './fixtures/auditCompleteReport.json'
import { runAuditFixture } from './runAuditFixture'

describe('unchanged dated advisory policy', () => {
  it('accepts a complete empty report', () => {
    const run = runAuditFixture({
      report: {
        ...complete,
        advisories: {},
        metadata: {
          ...complete.metadata,
          vulnerabilities: {
            ...complete.metadata.vulnerabilities,
            moderate: 0,
          },
        },
      },
      status: 0,
    })
    expect(run.status, run.stderr).toBe(0)
    expect(run.stdout).toContain(
      '0 advisories, gate at moderate: 0 unwaived, 0 expired, 0 waived',
    )
  })

  it.each(['moderate', 'high', 'critical'] as const)(
    'preserves active %s exceptions with native findings exit',
    (severity) => {
      const report = {
        ...complete,
        advisories: { 100: { ...complete.advisories['100'], severity } },
        metadata: {
          ...complete.metadata,
          vulnerabilities: {
            info: 0,
            low: 0,
            moderate: 0,
            high: 0,
            critical: 0,
            [severity]: 1,
          },
        },
      }
      const run = runAuditFixture({
        report,
        allowlist: {
          'GHSA-audit-fixture': {
            reason: 'Existing synthetic exception',
            expires: '9999-12-31',
          },
        },
      })
      expect(run.status, run.stderr).toBe(0)
      expect(run.stdout).toContain('0 unwaived, 0 expired, 1 waived')
    },
  )

  it('preserves numeric advisory-id exceptions', () => {
    const run = runAuditFixture({
      report: complete,
      allowlist: {
        100: { reason: 'Existing numeric exception', expires: '9999-12-31' },
      },
    })
    expect(run.status, run.stderr).toBe(0)
    expect(run.stdout).toContain('1 waived')
  })

  it('fails an unwaived moderate advisory', () => {
    const run = runAuditFixture({ report: complete })
    expect(run.status).toBe(1)
    expect(run.stderr).toContain('FAIL')
    expect(run.stdout).toContain('1 unwaived, 0 expired, 0 waived')
  })

  it('fails an expired exception', () => {
    const run = runAuditFixture({
      report: complete,
      allowlist: {
        'GHSA-audit-fixture': {
          reason: 'Expired synthetic exception',
          expires: '2000-01-01',
        },
      },
    })
    expect(run.status).toBe(1)
    expect(run.stderr).toContain('EXPIRED')
    expect(run.stdout).toContain('0 unwaived, 1 expired, 0 waived')
  })

  it('retains the moderate threshold without ignoring higher severities', () => {
    const report = {
      ...complete,
      advisories: { 100: { ...complete.advisories['100'], severity: 'low' } },
      metadata: {
        ...complete.metadata,
        vulnerabilities: {
          ...complete.metadata.vulnerabilities,
          moderate: 0,
          low: 1,
        },
      },
    }
    const run = runAuditFixture({ report })
    expect(run.status, run.stderr).toBe(0)
    expect(run.stdout).toContain(
      '1 advisories, gate at moderate: 0 unwaived, 0 expired, 0 waived',
    )
    const strict = runAuditFixture({ report, level: 'low' })
    expect(strict.status).toBe(1)
    expect(strict.stdout).toContain('1 unwaived')
  })

  it('accepts explicit null patched versions as unpatched finding data', () => {
    const report = {
      ...complete,
      advisories: {
        100: { ...complete.advisories['100'], patched_versions: null },
      },
    }
    const run = runAuditFixture({ report })
    expect(run.status).toBe(1)
    expect(run.stderr).toContain('patched in null')
    expect(run.stdout).toContain('1 unwaived')
  })

  it.each(['{', { 'GHSA-audit-fixture': { expires: '9999-12-31' } }])(
    'rejects a malformed allowlist: %j',
    (allowlist) => {
      const run = runAuditFixture({ report: complete, allowlist })
      expect(run.status).toBe(2)
    },
  )
  it.each(['constructor', 'toString', '__proto__'])(
    'never inherits GitHub advisory waiver %s',
    (identity) => {
      const report = {
        ...complete,
        advisories: {
          100: { ...complete.advisories['100'], github_advisory_id: identity },
        },
      }
      const run = runAuditFixture({ report, allowlist: {} })
      expect(run.status, run.stdout + run.stderr).toBe(1)
      expect(run.stdout).toContain('1 unwaived, 0 expired, 0 waived')
      expect(run.stdout).not.toContain('expires undefined')
    },
  )

  it.each(['constructor', 'toString', '__proto__'])(
    'never inherits numeric advisory waiver %s',
    (identity) => {
      const advisory = { ...complete.advisories['100'], id: identity }
      Reflect.deleteProperty(advisory, 'github_advisory_id')
      const report = { ...complete, advisories: { [identity]: advisory } }
      const run = runAuditFixture({ report, allowlist: {} })
      expect(run.status, run.stdout + run.stderr).toBe(1)
      expect(run.stdout).toContain('1 unwaived, 0 expired, 0 waived')
    },
  )

  it('retains an explicitly owned advisory exception without prototype inheritance', () => {
    const report = {
      ...complete,
      advisories: {
        100: { ...complete.advisories['100'], github_advisory_id: '__proto__' },
      },
    }
    const allowlist: unknown = JSON.parse(
      '{"__proto__":{"reason":"Explicit own synthetic exception","expires":"9999-12-31"}}',
    )
    const run = runAuditFixture({ report, allowlist })
    expect(run.status, run.stdout + run.stderr).toBe(0)
    expect(run.stdout).toContain('0 unwaived, 0 expired, 1 waived')
  })
})
