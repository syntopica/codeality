import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

const emptyDialogsOf = async (path: string): Promise<string[]> => {
  const root = mkdtempSync(join(tmpdir(), 'uiq-'))
  writeFileSync(
    join(root, 'codeality-ui.json'),
    JSON.stringify({
      baseUrl: `file://${site}`,
      routes: [{ path, click: ['#open'] }],
      viewports: [{ width: 390, height: 844, mobile: true }],
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
    .filter((finding) => finding.rule === 'empty-dialog')
    .map((finding) => finding.subject)
}

describe('codeality-ui empty dialog', () => {
  it('reports a drawer that opens onto nothing but its close button', async () => {
    expect(await emptyDialogsOf('/drawer.html#empty')).toEqual(['div.drawer'])
  }, 120_000)
  it('passes the drawer once its links arrive', async () => {
    expect(await emptyDialogsOf('/drawer.html')).toEqual([])
  }, 120_000)
})
