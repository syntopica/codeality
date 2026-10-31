import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

import { captureCli } from './captureCli.js'
import { cliProject } from './cliProject.js'

describe('codeality-ui table controls', () => {
  it('sorts and searches the main table, and reports the controls that do not work', async () => {
    const working = captureCli(cliProject(['/table.html']))
    expect(await runCli(['check'], working.io)).toBe(0)
    const broken = captureCli(cliProject(['/table.html#broken']))
    expect(await runCli(['check', '--json'], broken.io)).toBe(1)
    const { findings } = JSON.parse(broken.out.join('')) as {
      findings: { rule: string; subject: string }[]
    }
    expect(
      findings.map((finding) => `${finding.rule} ${finding.subject}`).sort(),
    ).toEqual(['filter-broken search box', 'sort-broken column "Amount"'])
    // Every control that changes nothing is waited out in full, so the
    // broken page takes longer than one that works.
  }, 120_000)
})
