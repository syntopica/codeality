import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

const rulesOf = async (route: string): Promise<string[]> => {
  const root = mkdtempSync(join(tmpdir(), 'uiq-'))
  writeFileSync(
    join(root, 'codeality-ui.json'),
    JSON.stringify({
      baseUrl: `file://${site}`,
      routes: [route],
      viewports: [{ width: 1440, height: 900 }],
      colorSchemes: ['light', 'dark'],
    }),
  )
  const out: string[] = []
  await runCli(['check', '--json'], {
    root,
    stdout: (text: string) => out.push(text),
    stderr: () => undefined,
  })
  const { findings } = JSON.parse(out.join('')) as {
    findings: { rule: string }[]
  }
  return findings.map((finding) => finding.rule)
}

describe('codeality-ui dark scheme', () => {
  it('warns when the dark pass renders the light page again', async () => {
    expect(await rulesOf('/fixed.html')).toEqual(['dark-scheme-ignored'])
  }, 120_000)
  it('stays quiet on a page that honours prefers-color-scheme', async () => {
    expect(await rulesOf('/broken.html')).not.toContain('dark-scheme-ignored')
  }, 120_000)
})
