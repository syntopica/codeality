import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

import { captureCli } from './captureCli.js'
import { cliProject } from './cliProject.js'

describe('codeality-ui table feedback', () => {
  it('searches for nothing, pages the table and fails a save, and reports what the user is not told', async () => {
    const silent = captureCli(cliProject(['/table.html#silent']))
    expect(await runCli(['check', '--json'], silent.io)).toBe(1)
    const { findings } = JSON.parse(silent.out.join('')) as {
      findings: { rule: string; subject: string }[]
    }
    expect(
      findings.map((finding) => `${finding.rule} ${finding.subject}`).sort(),
    ).toEqual([
      'action-silent form submit "Add"',
      'empty-state-missing search box',
      'pagination-broken next page',
    ])
  })
  it('reports a table that renders every row with no pager', async () => {
    const long = captureCli(cliProject(['/long.html']))
    expect(await runCli(['check', '--json'], long.io)).toBe(1)
    const { findings } = JSON.parse(long.out.join('')) as {
      findings: { rule: string; subject: string }[]
    }
    expect(
      findings.map((finding) => `${finding.rule} ${finding.subject}`),
    ).toEqual(['pagination-missing main table'])
  })
})
