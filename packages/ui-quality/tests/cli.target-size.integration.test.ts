import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

describe('codeality-ui axe target-size', () => {
  it('reports controls too small and too close to tap alone', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(
      join(root, 'codeality-ui.json'),
      JSON.stringify({
        baseUrl: `file://${site}`,
        routes: ['/targets.html'],
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
    expect(findings.map((finding) => finding.rule)).toContain(
      'a11y/target-size',
    )
  }, 120_000)
})
