import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

const paginationFindings = async (route: string): Promise<string[]> => {
  const root = mkdtempSync(join(tmpdir(), 'uiq-'))
  writeFileSync(
    join(root, 'codeality-ui.json'),
    JSON.stringify({
      baseUrl: `file://${site}`,
      routes: [route],
      viewports: [{ width: 1440, height: 900 }],
      colorSchemes: ['light'],
    }),
  )
  const out: string[] = []
  await runCli(['check', '--json'], {
    root,
    stdout: (text: string) => out.push(text),
    stderr: () => undefined,
  })
  const { findings } = JSON.parse(out.join('')) as {
    findings: { rule: string; subject: string }[]
  }
  return findings
    .filter((finding) => finding.rule.startsWith('pagination-'))
    .map((finding) => `${finding.rule} ${finding.subject}`)
}

describe('codeality-ui pagination on a card grid with no table', () => {
  it('follows a pager that loads another page of cards and back', async () => {
    expect(await paginationFindings('/grid.html')).toEqual([])
  })
  it('reports a next page that shows the same cards', async () => {
    expect(await paginationFindings('/grid.html#same')).toEqual([
      'pagination-broken next page',
    ])
  })
  it('reports a next page that repeats most of the first page', async () => {
    expect(await paginationFindings('/grid.html#overlap')).toEqual([
      'pagination-broken next page',
    ])
  })
  it('reports a numbered link to page 2 that changes neither address nor cards', async () => {
    expect(await paginationFindings('/grid.html#stuck')).toEqual([
      'pagination-broken next page',
    ])
  })
})
