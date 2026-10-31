import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

import { captureCli } from './captureCli.js'
import { cliProject } from './cliProject.js'

describe('codeality-ui table with a tight header', () => {
  it('finds the table again when its header cells have no space between them', async () => {
    // Read as innerText, a header rendered with no whitespace between its
    // cells matched no table, so the search saw no rows at all and reported a
    // missing empty state instead of the search that does not filter.
    const tight = captureCli(cliProject(['/table.html#broken-tight']))
    expect(await runCli(['check', '--json'], tight.io)).toBe(1)
    const { findings } = JSON.parse(tight.out.join('')) as {
      findings: { rule: string; subject: string }[]
    }
    expect(
      findings.map((finding) => `${finding.rule} ${finding.subject}`).sort(),
    ).toEqual(['filter-broken search box', 'sort-broken column "Amount"'])
  }, 120_000)
})
