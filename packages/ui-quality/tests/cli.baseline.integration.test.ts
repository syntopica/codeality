import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

import { captureCli } from './captureCli.js'
import { cliProject } from './cliProject.js'

describe('codeality-ui baseline', () => {
  it('passes the fixed inbox, and the baseline carries known debt', async () => {
    const fixed = cliProject(['/fixed.html'])
    const run = captureCli(fixed)
    expect(await runCli(['check'], run.io)).toBe(0)
    expect(run.out.join('')).toContain('0 findings')
    const broken = cliProject(['/broken.html'], ['light', 'dark'])
    expect(await runCli(['baseline', 'create'], captureCli(broken).io)).toBe(0)
    expect(await runCli(['baseline', 'create'], captureCli(broken).io)).toBe(2)
    const check = captureCli(broken)
    expect(await runCli(['check'], check.io)).toBe(0)
    expect(check.out.join('')).toMatch(/0 new, \d+ known, 0 resolved/)
    expect(await runCli(['baseline', 'check'], captureCli(broken).io)).toBe(0)
    expect(await runCli(['baseline', 'update'], captureCli(broken).io)).toBe(0)
    // Five full captures in a row: 17 s on a laptop, over 60 s on a shared
    // CI runner.
  }, 240_000)
})
