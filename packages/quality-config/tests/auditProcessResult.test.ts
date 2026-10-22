import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('audit subprocess result contract', () => {
  it.each([
    {
      status: null,
      error: { message: 'synthetic-sensitive-error' },
      stdout: '{}',
    },
    { status: null, signal: 'SIGTERM', stdout: '{}' },
    { status: null, stdout: '{}' },
  ])('rejects operational result %j without printing raw details', (result) => {
    const entry = new URL('../bin/readAuditReport.mjs', import.meta.url).href
    const run = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `import { readAuditReport } from ${JSON.stringify(entry)}; try { readAuditReport(${JSON.stringify(result)}); process.stdout.write('unexpected pass'); } catch (error) { process.stderr.write(String(error)); process.exitCode = 2; }`,
      ],
      { encoding: 'utf8', timeout: 10_000 },
    )
    expect(run.status).toBe(2)
    expect(run.stderr).toContain('Could not complete pnpm audit')
    expect(run.stderr).not.toContain('synthetic-sensitive-error')
    expect(run.stdout).toBe('')
  })
})
