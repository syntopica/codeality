import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

const behaviourRules = async (route: string): Promise<string[]> => {
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
    findings: { rule: string }[]
  }
  return findings
    .map((finding) => finding.rule)
    .filter((rule) => rule.endsWith('-broken') || rule.endsWith('-missing'))
}

describe('codeality-ui behaviour on grouped and covered lists', () => {
  it('follows a row that moves to another table of the same list', async () => {
    expect(await behaviourRules('/grouped.html')).toEqual([])
  })
  it('leaves a list alone while a dialog covers it', async () => {
    expect(await behaviourRules('/grouped.html#modal')).toEqual([])
  })
})
